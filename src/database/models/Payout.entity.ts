import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import Model from './Model.entity';
import User from './User.entity';
import Transaction from './Transaction.model';

@Entity('payouts')
export default class Payout extends Model {
  @ManyToOne(() => User, (user) => user.payouts)
  user: User;

  @Column({ nullable: false, type: 'float8' })
  amount: number;

  @Column({ nullable: false })
  downloads: number;

  @Column({ nullable: false, type: 'float8' })
  creditValue: number;

  @Column({ nullable: false, default: false })
  paid: boolean;

  @OneToMany(() => Transaction, (tx) => tx.payout)
  transactions: Transaction[];

  @Column({ nullable: true })
  paidDate: Date;
  // csv string that contains the payout summary sent to the user
  @Column({ nullable: false })
  summary: string;
}
