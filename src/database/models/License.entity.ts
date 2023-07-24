import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import Model from './Model.entity';
import User from './User.entity';
import Transaction from './Transaction.model';

export type LicenseType = 'limited' | 'unlimited';

@Entity('licenses')
export default class License extends Model {
  @Column({ nullable: false })
  type: LicenseType;

  @ManyToOne(() => User, (user) => user.licenses, { nullable: false })
  @JoinColumn()
  user: User;

  @Column({ nullable: false })
  beat: string;

  @OneToOne(() => Transaction, (transaction) => transaction)
  @JoinColumn()
  transaction: Transaction;
}
