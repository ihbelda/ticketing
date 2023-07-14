import { Publisher, PaymentCreatedEvent, Subjects } from '@anei/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
}
