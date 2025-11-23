import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import RabbitConnection, {
  AsyncMessage,
  Consumer,
  ConsumerStatus,
  Publisher,
} from 'rabbitmq-client';

@Injectable()
export class RabbitMqService implements OnModuleDestroy {
  private readonly client: RabbitConnection;
  private publisher?: Publisher;
  private consumers: Consumer[] = [];

  constructor() {
    this.client = new RabbitConnection({
      url: process.env.MESSAGE_QUEUE_URL ?? 'amqp://guest:guest@rabbitmq:5672',
      connectionName: 'subscription-service',
      retryLow: 1000,      // Wait 1 second before retrying after first failure
      retryHigh: 30000,    // Wait up to 30 seconds between retries
      connectionTimeout: 60000, // 60 second timeout for initial connection
    });

    this.client.on('error', (err) => {
      console.error('RabbitMQ connection error', err);
    });

    this.client.on('connection', () => {
      console.log('RabbitMQ connection established');
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client.ready) {
      console.log('Waiting for RabbitMQ connection...');
      await this.client.onConnect();
      console.log('RabbitMQ connected successfully');
    }
  }

  private async getPublisher(): Promise<Publisher> {
    if (!this.publisher) {
      await this.ensureConnected();
      this.publisher = this.client.createPublisher({ confirm: true });
    }
    return this.publisher;
  }

  async publish(queue: string, message: string): Promise<void> {
    const publisher = await this.getPublisher();
    await publisher.send(queue, message);
  }

  async consume(
    queue: string,
    handler: (content: string) => Promise<void>,
  ): Promise<void> {
    await this.ensureConnected();
    const consumer = this.client.createConsumer(
      {
        queue,
        queueOptions: { queue, durable: true },
        noAck: false,
      },
      async (msg: AsyncMessage) => {
        try {
          const body = this.parseMessageBody(msg);
          await handler(body);
          return ConsumerStatus.ACK;
        } catch (error) {
          console.error(
            `Error processing message from ${queue}`, error instanceof Error ? error.stack : String(error),
          );
          return ConsumerStatus.REQUEUE;
        }
      },
    );
    this.consumers.push(consumer);
  }

  private parseMessageBody(msg: AsyncMessage): string {
    if (typeof msg.body === 'string') {
      return msg.body;
    }
    if (Buffer.isBuffer(msg.body)) {
      return msg.body.toString();
    }
    if (msg.body === undefined || msg.body === null) {
      return '';
    }
    return JSON.stringify(msg.body);
  }

  async checkHealth(): Promise<boolean> {
    try {
      return this.client.ready;
    } catch (error) {
      console.error('Error checking RabbitMQ health', error);
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.publisher) {
      await this.publisher.close();
    }
    await Promise.allSettled(this.consumers.map((consumer) => consumer.close()));
    await this.client.close();
  }
}

