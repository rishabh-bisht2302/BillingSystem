import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.schema';

@Entity({ name: 'user_mandates' })
export class UserMandateEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    mandateId!: string;

    @Column({ length: 100 })
    paymentMethodToken!: string;

    @ManyToOne(() => UserEntity, { nullable: false })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity;
  
    @Column()
    userId!: number;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    modifiedAt!: Date;
}

  