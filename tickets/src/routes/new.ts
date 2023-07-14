import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { requireAuth, validateRequest } from '@anei/common'
import { Ticket } from '../models/ticket';
import { TickerCreatedPublisher } from '../events/publishers/ticket-created-publishers';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post('/api/tickets', requireAuth, [
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

  const ticket = Ticket.build({ 
    title,
    price,
    userId: req.currentUser!.id
  });
  // ¡¡!!FOR PRODUCTION WE NEED TO:
  // - CREATE ADB TRANSACTION TO ENSURE THE TICKET AND THE EVENT ARE OK IN THE DB
  // - BUILD ANOTHER CODE TO DOS 2-STEP PROCESS TO PUBLISH EVENTS STORED IN THE DB
  await ticket.save();
  // do we really need to wait until we publish the event?
  await new TickerCreatedPublisher(natsWrapper.client).publish({
    id: ticket.id,
    title: ticket.title,
    price: ticket.price,
    userId: ticket.userId,
    version: ticket.version
  });

  res.status(201).send(ticket);

});

export { router as createTicketRouter }