import { Publisher, OrderCancelledEvent, Subjects } from '@anei/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}


