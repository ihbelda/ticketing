import { Publisher, ExpirationCompleteEvent, Subjects } from '@anei/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
}
