import nats, { Message, Stan } from 'node-nats-streaming';
import { Subjects } from './subjects';

interface Event {
  subject: Subjects;
  data: any;
}

// Everytime me extend Listener we need to provide an Event
export abstract class Listener< T extends Event> {
  abstract subject: T['subject']; // to use in the subclass, not in this class
  abstract queueGroupName: string;
  abstract onMessage(data: T['data'], msg: Message): void;
  private client: Stan;
  protected ackWait = 5 * 1000; // 5sc we setup values here, don't need to be abstract

  constructor(client: Stan) {
    this.client = client;
  }

  subscriptionOptions() {
    return this.client
      .subscriptionOptions()
      .setDeliverAllAvailable() // NATS resend all the events when the listener is up
      .setManualAckMode(true)
      .setAckWait(this.ackWait)
      .setDurableName(this.queueGroupName); // Create groups of transactions 
  }

  listen () {
    const subscription = this.client.subscribe(
      this.subject,
      this.queueGroupName, // use groups for more than one instance of a service to avoid to remove the durable names if a short disconnect
      this.subscriptionOptions()
    );

    subscription.on('message', (msg: Message) => {
      console.log(
        `Message received: ${this.subject} / ${this.queueGroupName}`
      );

    const parsedData = this.parseMessage(msg);
    this.onMessage(parsedData, msg);
    });

  }
 
  parseMessage(msg: Message) {
    const data = msg.getData();
    return typeof data === 'string'
      ? JSON.parse(data)
      : JSON.parse(data.toString('utf8'));
  }
  
}

