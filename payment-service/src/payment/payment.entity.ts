import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from './interfaces/payment.interface';

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid' })
  orderId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionId?: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value ? Number(value) : 0),
    },
  })
  amount!: number;

  @Column({ type: 'int', nullable: true })
  planId?: number | null;

  @Column({ length: 100 })
  gateway!: string;

  @Column({ length: 50 })
  status!: PaymentStatus;

  @Column({ type: 'int' })
  subscriptionId!: number;

  @Column({ type: 'int', nullable: true })
  previousPlanId?: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  actionType?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

