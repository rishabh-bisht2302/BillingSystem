import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentWebhookEvent } from '../payment/interfaces/payment.interface';

@Entity({ name: 'payment_webhook_events' })

export class PaymentWebhookEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  subscriptionId!: number;

  @Column({ type: 'int' })
  paymentId?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionId?: string | null;

  @Column({ type: 'int', nullable: true })
  refundId?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metaData?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 20, default: 'success' })
  paymentStatus!: PaymentWebhookEvent;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

