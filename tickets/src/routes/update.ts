import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { requireAuth, validateRequest, NotFoundError, NotAuthorizedError, BadRequestError } from '@anei/common'
import { Ticket } from '../models/ticket';
import { TickerUpdatedPublisher } from '../events/publishers/ticket-updated-publishers';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.put('/api/tickets/:id', requireAuth, [
  body('title')
    .not()
    .isEmpty()
    .withMessage('Title is required'),
  body('price')
    .isFloat({ gt: 0 })
    .withMessage('Price must be greater than 0') 
],
validateRequest,
async (req: Request, res: Response) => {
  const { title, price } = req.body;

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    throw new NotFoundError();
  }

  if (ticket.orderId) {
    throw new BadRequestError('Cannot edit a reserved ticket');  
  }

  if (ticket.userId !== req.currentUser!.id ) {
     throw new NotAuthorizedError(); 
  }

  ticket.set({
    title: req.body.title,
    price: req.body.price
  });

  await ticket.save();

  new TickerUpdatedPublisher(natsWrapper.client).publish({
    id: ticket.id,
    title: ticket.title,
    price: ticket.price,
    userId: ticket.userId,
    version: ticket.version
  });

  res.status(200).send(ticket);

});

export { router as updateTicketRouter }