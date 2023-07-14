import nats, { Stan } from 'node-nats-streaming';

class NatsWrapper {
  private _client?: Stan;

  get client() {
    if (!this._client) {
      throw new Error('Cannot access NATS client before connecting');
    }

    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string) {
    console.log(clusterId, clientId, { url });
    //this._client = nats.connect(clusterId, clientId, { url, reconnect: true, reconnectTimeWait: 100, maxReconnectAttempts: 5, waitOnFirstConnect: true });
    //this._client = nats.connect(clusterId, clientId, { url, waitOnFirstConnect: true });
    this._client = nats.connect(clusterId, clientId, { url });

    return new Promise<void>((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('==Orders Service: Connected to NATS==');
        resolve();
      });
      this.client.on('error', (err) => {
        reject(err);
      });

    })

  }
}

export const natsWrapper = new NatsWrapper();