import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { BadRequestError, NotFoundError, OrderStatus, requireAuth, validateRequest } from '@anei/common'
import { Ticket } from '../models/ticket';
import { Order } from '../models/order';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

// A) Add as a K8s ENV VAR to be able to change it without redeploying 
// B) Create a field in the DB (even per user) to setup the expiration
const EXPIRATON_WINDOW_SECONDS = 1 * 60;

router.post('/api/orders', requireAuth, [
// Validation of params  
  body('ticketId')
  .not()
  .isEmpty()
  // custom validation, useful but we are binding tickets service implementation details
  .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
  .withMessage('TicketId must be provided')
], validateRequest, 
async (req: Request, res: Response) => {
  const { ticketId } = req.body;

  // Find the ticket the user is trying to order in the database
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new NotFoundError();
  }

  // Make sure the ticket is not already reserved
  // Run query to look at all orders. Find an order where the ticket
  // is the ticket we just found *and*  the order status is *not* cancelled.
  // If we find an order from that means the ticket *is* reserved

  const isReserved = await ticket.isReserved();
  if (isReserved) {
    throw new BadRequestError('Ticket is already reserved');
  }
  
  // Calculate an expriration date for this order
  const expiration = new Date(); // created with now time
  expiration.setSeconds(expiration.getSeconds() + EXPIRATON_WINDOW_SECONDS);

  // Build the order and save it to the database
  const order = Order.build({
    userId: req.currentUser!.id,
    status: OrderStatus.Created,
    expiresAt: expiration,
    ticket
  });
  await order.save();

  // Publish event saying that an order was created
  new OrderCreatedPublisher(natsWrapper.client).publish({
    id: order.id,
    version: order.version,
    status: order.status,
    userId: order.userId,
    expiresAt: order.expiresAt.toISOString(), // Deal with TZ -> use UTC to be agnostic
    ticket: {
      id: ticket.id,
      price: ticket.price
    }
  });

  res.status(201).send(order);
});

export { router as newOrderRouter };