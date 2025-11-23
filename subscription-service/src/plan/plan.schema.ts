import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'plans' })
export class PlanEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  planName!: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value ? Number(value) : 0),
    },
  })
  price!: number;

  @Column({ type: 'int' })
  validityInDays!: number;


  @Column({ default: false })
  isNew!: boolean;

  @Column({ default: false })
  isPromotional!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  descriptionOfPlan?: string;

  @Column({ type: 'int', default: 0 })
  subscriberCount!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  modifiedAt!: Date;

  @Column({ length: 100, nullable: true })
  createdBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ length: 100, nullable: true })
  deletedBy?: string;
}

