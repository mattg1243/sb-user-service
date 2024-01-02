import { Entity, Column, BeforeInsert, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { Length } from 'class-validator';
import Model from './Model.entity';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import License from './License.entity';
import Transaction from './Transaction.model';
import EmailVerify from './EmailVerify.entity';
import CreditAllocation from './CreditAllocation.model';
import Payout from './Payout.entity';

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

  @Column({ nullable: true })
  socialLink: string;

  @Column({ nullable: true })
  @Length(0, 32)
  fname: string;

  @Column({ nullable: true })
  @Length(0, 32)
  lname: string;

  @Column({ nullable: false, default: new Date() })
  dateOfBirth: Date;
  // these credit columns will reset every month
  @Column({ default: 0 })
  creditsToSpend: number;

  @OneToMany(() => CreditAllocation, (creditAllocation) => creditAllocation.user)
  creditAllocations: CreditAllocation[];

  @OneToMany(() => License, (license) => license.user)
  licenses: License[];

  @OneToMany(() => Transaction, (transaction) => transaction.purchasingUser)
  buyTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.sellingUser)
  sellTransactions: Transaction[];

  @OneToMany(() => Payout, (payout) => payout.user)
  payouts: Payout[];
  
  @Column({ default: 0 })
  creditsAcquired: number;
  
  @Column({ default: '' })
  payoutMethod: 'stripe' | 'paypal';
  // this one will not reset
  @Column({ default: 0 })
  totalCreditsAcquired: number;
  // one to many, list of beat IDs
  @Column({ array: true, default: [] })
  uploadedBeats: string;

  @Column({ default: '' })
  subTier: 'basic' | 'std' | 'prem';

  @Column({ default: '' })
  stripeCustomerId: string;

  @Column({ default: '' })
  stripeConnectId: string;

  @Column({ default: '' })
  stripeSubId: string;

  @Column({ default: '' })
  stripeSubStatus:
    | 'trialing'
    | 'active'
    | 'incomplete'
    | 'incomplete_expired'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | 'paused';

  @Column({ default: '' })
  paypalMerchantId: string;
  // promo code users can share for people to sub with
  @Column({ nullable: true, select: false })
  subRefCode: string;
  // id of referring user if any
  @Column({ nullable: true, select: false })
  subReferrer: string;
  // email verified?
  @Column({ default: false })
  verified: boolean;

  @Column({ nullable: true, select: false })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  passwordResetTokenExp: Date;

  @OneToOne(() => EmailVerify, (emailVerify) => emailVerify.user)
  emailVerify: EmailVerify;

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

  setSubStatus(status: typeof this.stripeSubStatus) {
    this.stripeSubStatus = status;
  }

  setCustomerId(customerId: string) {
    this.stripeCustomerId = customerId;
  }

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }

  @BeforeInsert()
  validateSocialLink() {}

  // validating password
  static async comparePasswords(candidatePassword: string, hashedPassword: string) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}
