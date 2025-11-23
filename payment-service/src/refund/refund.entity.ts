import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../payment/interfaces/payment.interface';

@Entity({ name: 'refunds' })
export class RefundEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  paymentId!: number;

  @Column({ type: 'int' })
  subscriptionId!: number;

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

  @Column({ length: 100 })
  gateway!: string;

  @Column({ length: 50 })
  status!: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

