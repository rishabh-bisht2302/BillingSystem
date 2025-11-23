import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ length: 100 })
  userType!: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ length: 20, unique: true, nullable: true })
  mobile?: string;

  @Column({ nullable: true })
  passwordHash!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'int', nullable: true })
  age?: number;
}