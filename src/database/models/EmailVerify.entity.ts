import { Entity, Column, Generated, JoinColumn, OneToOne } from 'typeorm';
import Model from './Model.entity';
import User from './User.entity';

@Entity('email_verify')
export default class EmailVerify extends Model {
  @Column()
  @Generated('uuid')
  hash: string;

  @OneToOne(() => User, (user) => user.emailVerify)
  @JoinColumn()
  user: User;
}
