import stripe from 'stripe';
import { CLIENT_HOST } from '../app';
import dotenv from 'dotenv';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';

const apiKey = dev ? process.env.STRIPE_TEST_KEY : process.env.STRIPE_API_KEY;

const stripeConfig: stripe.StripeConfig = {
  apiVersion: '2022-11-15',
  typescript: true,
};

export default class StripeClient {
  readonly s: stripe;
  private readonly liveProducts = {
    // THIS PRICE IS ONLY 1 DOLLAR, CHANGE BEFORE RELEASE
    basicSub: 'price_1NSWZiDvAr9mohsEgcj9N5Yn',
    stdSub: 'price_1NQgaWDvAr9mohsEa5ZdB8O9',
    premSub: 'price_1NQgbfDvAr9mohsEVxScWxFs',
  };
  private readonly testProducts = {
    basicSub: 'price_1NRNMNDvAr9mohsEZ50muJeR',
    stdSub: 'price_1NSSn9DvAr9mohsEFJM6Mn81',
    premSub: 'price_1NSSnqDvAr9mohsEe4CeMWCu',
  };

  private readonly products = {
    basicSub: '',
    stdSub: '',
    premSub: '',
  };
  // TODO add a price catalog to this config so users can easily upgrade their sub tier from the portal
  private customerPortalConfig: stripe.Response<stripe.BillingPortal.Configuration>;

  constructor() {
    this.s = new stripe(apiKey as string, stripeConfig);
    // this.s.billingPortal.configurations
    //   .create({
    //     business_profile: {
    //       headline: 'Sweatshop Beats partners with Stripe for simplified billing.',
    //     },
    //     features: {
    //       invoice_history: {
    //         enabled: true,
    //       },
    //       customer_update: {
    //         enabled: true,
    //       },
    //       payment_method_update: {
    //         enabled: true,
    //       },
    //     },
    //   })
    //   .then((value) => (this.customerPortalConfig = value));
    dev ? (this.products = this.testProducts) : (this.products = this.liveProducts);
  }

  async createCustomer(email: string) {
    return await this.s.customers.create({ email });
  }

  async createSubscription(subTier: keyof typeof this.products, customerId: string) {
    return await this.s.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: this.products[subTier],
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
  }

  private async createSubCheckoutSession(subTier: keyof typeof this.products) {
    return await this.s.checkout.sessions.create({
      line_items: [
        {
          price: this.products[subTier],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${CLIENT_HOST}/app/dash?sub-success=true`,
      cancel_url: `${CLIENT_HOST}/subscriptions?sub-failure=true`,
      payment_method_types: ['card'],
    });
  }

  async createPortalSession(customerId: string) {
    return await this.s.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${CLIENT_HOST}/app/account`,
    });
  }

  async constructWebhookEvent(reqBody: string | Buffer, signature: string, secret: string) {
    return this.s.webhooks.constructEvent(reqBody, signature, secret);
  }

  async createBasicTierCheckout() {
    return await this.createSubCheckoutSession('basicSub');
  }

  async createStdTierCheckout() {
    return await this.createSubCheckoutSession('stdSub');
  }

  async createPremTierCheckout() {
    return await this.createSubCheckoutSession('premSub');
  }

  getProducts() {
    if (dev) {
      return this.testProducts;
    } else {
      return this.liveProducts;
    }
  }

  async getPaymentIntent(paymentIntentId: string) {
    return await this.s.paymentIntents.retrieve(paymentIntentId);
  }
}
