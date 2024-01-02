import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import Model from './Model.entity';
import License from './License.entity';
import User from './User.entity';
import Payout from './Payout.entity';

@Entity('transactions')
export default class Transaction extends Model {
  @Column({ nullable: false })
  beatId: string;

  @Column({ nullable: false })
  creditAmount: number;

  @ManyToOne(() => User, (user) => user.buyTransactions)
  @JoinColumn()
  purchasingUser: User;

  @ManyToOne(() => User, (user) => user.sellTransactions)
  @JoinColumn()
  sellingUser: User;

  @ManyToOne(() => Payout, (payout) => payout.transactions, { nullable: true })
  payout: Payout;

  @OneToOne(() => License, (license) => license.transaction)
  license: License;
}
