import { Entity, Column, Generated } from 'typeorm';
import Model from './Model.entity';

@Entity('email_verify')
export default class EmailVerify extends Model {
  @Column()
  @Generated('uuid')
  hash: string;

  @Column()
  userId: string;
}
