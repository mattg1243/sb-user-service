import { Entity, Column, BeforeInsert } from 'typeorm';
import Model from './Model.entity';
import * as bcrypt from 'bcrypt';

@Entity('users')
export default class User extends Model {
  // @Index('emailIndex')
  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  artistName: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  bio: string;
  // all images will be stored in the s3 bucket
  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'jsonb', array: false, default: {}})
  linkedSocials: {
    youtube: string;
    spotify: string;
    soundcloud: string;
    appleMusic: string;
    twitter: string;
    instagram: string;
  };

  @Column({ nullable: true })
  fname: string;

  @Column({ nullable: true })
  lname: string;
  // these credit columns will reset every month
  @Column({ default: 0 })
  creditsToSpend: number;

  @Column({ default: 0 })
  creditsAcquired: number;
  // this one will not reset
  @Column({ default: 0 })
  totalCreditsAcquired: number;
  // one to many, list of beat IDs
  @Column({ array: true, default: [] })
  uploadedBeats: string;

  @Column({ default: 0 })
  subTier: 0 | 1 | 2 | 3;
  // email verified?
  @Column({ default: false })
  verified: boolean;

  toJSON() {
    return { ...this, password: undefined };
  }
  // password hasing
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }
  // validating password
  static async comparePasswords(candidatePassword: string, hashedPassword: string) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}
