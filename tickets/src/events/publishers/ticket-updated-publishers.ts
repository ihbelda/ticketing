import { Publisher, Subjects, TicketUpdatedEvent } from '@anei/common';

export class TickerUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}