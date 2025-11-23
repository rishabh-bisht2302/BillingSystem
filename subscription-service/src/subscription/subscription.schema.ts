import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.schema';
import { PlanEntity } from '../plan/plan.schema';

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  paymentId?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionId?: string | null;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  userId!: number;

  @ManyToOne(() => PlanEntity)
  @JoinColumn({ name: 'planId' })
  plan!: PlanEntity;

  @Column({ type: 'int' })
  planId!: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  paymentStatus!: 'pending' | 'success' | 'failed' | 'refund_success' | 'refund_failed';

  @Column({ type: 'varchar', length: 50, default: 'inactive' })
  subscriptionStatus!: 'inactive' | 'active' | 'paused' | 'canceled';

  @Column({ type: 'int', nullable: true})
  refundId?: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: 'varchar', length: 50, default: 'razorpay' })
  gateway!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'timestamptz' })
  expiresOn!: Date;

  @Column({ type: 'int', nullable: true })
  downgradeSubscriptionId?: number | null;
  
  @Column({ type: 'text', nullable: true })
  receiptUrl?: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  modifiedAt!: Date;
}

