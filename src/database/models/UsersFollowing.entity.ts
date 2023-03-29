import { Entity, Column, ManyToOne } from 'typeorm';
import Model from './Model.entity';
import User from './User.entity';

@Entity('following')
export default class UsersFollowing extends Model {
  @Column()
  user_id: string;

  @Column('simple-array', { nullable: true })
  following: string[];
}
