import { Entity, Column } from 'typeorm';
import Model from './Model.entity';

@Entity('transactions')
export default class Transaction extends Model {
  @Column({ nullable: false, default: 1 })
  creditAmount: 1;

  @Column({ nullable: false })
  purchasingUser: string;

  @Column({ nullable: false })
  sellingUser: string;

}
