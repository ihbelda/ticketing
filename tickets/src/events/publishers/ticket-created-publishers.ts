import { Publisher, Subjects, TicketCreatedEvent } from '@anei/common';

export class TickerCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}