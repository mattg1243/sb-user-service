import { Entity, Column } from 'typeorm';
import Model from './Model.entity';

@Entity('payouts')
export default class Payout extends Model {
  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false, type: 'float8' })
  amount: number;

  @Column({ nullable: false })
  downloads: number;

  @Column({ nullable: false, type: 'float8' })
  creditValue: number;

  @Column({ nullable: false, default: false })
  paid: boolean;

  @Column({ nullable: true })
  paidDate: Date;
}
