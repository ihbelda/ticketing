import { Listener, OrderCancelledEvent, Subjects } from '@anei/common';
import { queueGroupName } from './queue-group-name';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { TickerUpdatedPublisher } from '../publishers/ticket-updated-publishers';


export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    // Find the ticket that the order is reserving
    const ticket = await Ticket.findById(data.ticket.id);

    // If no ticket, throw error
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    // Use undefined, rather than null
    ticket.set({ orderId: undefined });

    // Save the ticket
    await ticket.save();

    // Need to inform everyone by publishing an event
    // new TickerUpdatedPublisher(natsWrapper.client); // ok but need to import nats, tests more difficult
    await new TickerUpdatedPublisher(this.client).publish({  // best approach
      id: ticket.id,
      price: ticket.price,
      title: ticket.title,
      userId: ticket.userId,
      orderId: ticket.orderId,
      version: ticket.version
    });

    // ack the event
    msg.ack();
  }
} 