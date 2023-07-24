import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import Model from './Model.entity';
import User from './User.entity';

@Entity('credit_allocations')
export default class CreditAllocation extends Model {
  @Column()
  amount: number;

  @ManyToOne(() => User, (user) => user.creditAllocations)
  @JoinColumn()
  user: User;
}
