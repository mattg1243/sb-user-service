import { Entity, Column, OneToMany, ManyToOne } from "typeorm";
import Model from './Model.entity';
import User from "./User.entity";

@Entity('users_following')
export default class UsersFollowing extends Model {
  
  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user._id)
  following: string[];
  
}