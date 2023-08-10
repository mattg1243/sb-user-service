import { connect, Channel, Replies } from 'amqplib';

const exchName = 'noti-exchange';
const routingKey = 'noti-routing-key';
const queueName = 'noti-queue';

const qUrl = process.env.Q_URL || 'amqp://localhost:5672';

export class Producer {
  channel: Channel;

  constructor() {
    connect(qUrl).then((connection) => {
      connection.createChannel().then((channel) => {
        this.channel = channel;
      });
    });
  }

  async publishNotification(noti: { type: 'error' | 'success' | 'info'; msg: string }) {
    try {
      await this.channel.assertExchange(exchName, 'direct');
      this.channel.publish(exchName, routingKey, Buffer.from(JSON.stringify(noti)));
      console.log('The notifiation has been sent to notification exchange');
      return Promise.resolve();
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  }
}

export class Consumer {
  channel: Channel;
  // q: Replies.AssertQueue;

  constructor() {
    connect(qUrl).then((connection) => {
      connection.createChannel().then((channel) => {
        this.channel = channel;
      });
    });
  }

  async consumeNotifications() {
    await this.channel.assertExchange(exchName, 'direct');
    const q = await this.channel.assertQueue(queueName);

    await this.channel.bindQueue(q.queue, exchName, 'noti-routing-key');

    this.channel.consume(q.queue, (noti) => {
      if (noti) {
        const notiFromQ = noti.content.toJSON();
        console.log('noti from q: \n', notiFromQ);
        this.channel.ack(noti);
      } else {
        console.log('no noti from q');
      }
    });
  }
}

export const p = new Producer();

export const c = new Consumer();
