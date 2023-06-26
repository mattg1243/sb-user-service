import { Entity, Column, BeforeInsert } from 'typeorm';
import { Length } from 'class-validator';
import Model from './Model.entity';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

@Entity('users')
export default class User extends Model {
  // @Index('emailIndex')
  @Column({ unique: true })
  @Length(6, 320)
  email: string;

  @Column({ unique: true })
  @Length(6, 32)
  artistName: string;

  @Column({ select: false })
  @Length(10, 64)
  password: string;

  @Column({ nullable: true })
  @Length(0, 140)
  bio: string;
  // all images will be stored in the s3 bucket
  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'jsonb', array: false, default: {} })
  linkedSocials: {
    youtube: string;
    spotify: string;
    soundcloud: string;
    appleMusic: string;
    twitter: string;
    instagram: string;
  };

  @Column({ nullable: true })
  @Length(0, 32)
  fname: string;

  @Column({ nullable: true })
  @Length(0, 32)
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

  @Column({ nullable: true, select: false })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  passwordResetTokenExp: Date;

  toJSON() {
    return { ...this, password: undefined };
  }

  getPasswordResetToken() {
    return { token: this.passwordResetToken, exp: this.passwordResetTokenExp };
  }

  setPasswordResetToken() {
    this.passwordResetToken = randomBytes(32).toString('hex');
    const now = new Date();
    this.passwordResetTokenExp = new Date(now.getTime() + 30 * 60000);
    return this.passwordResetToken;
  }

  async setPassword(password: string) {
    this.password = await bcrypt.hash(password, 12);
  }

  // password hashing
  static async hashPassword(password: string) {
    return await bcrypt.hash(password, 12);
  }

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }
  // validating password
  static async comparePasswords(candidatePassword: string, hashedPassword: string) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}
