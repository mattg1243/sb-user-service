import stripe from 'stripe';
import { CLIENT_HOST } from '../app';
import dotenv from 'dotenv';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';

const apiKey = dev ? process.env.STRIPE_TEST_KEY : process.env.STRIPE_API_KEY;

interface StripeProduct {
  prices: Array<string>;
  product: string;
}

const stripeConfig: stripe.StripeConfig = {
  apiVersion: '2022-11-15',
  typescript: true,
};

export default class StripeClient {
  readonly s: stripe;

  private readonly liveProducts = {
    basicSub: { prices: ['price_1OULRbDvAr9mohsEZOwEDaH2'], product: 'prod_OD6dnPXf8qYZ2j', coupon: 'Ly4apepe' },
    stdSub: { prices: ['price_1Ndlb7DvAr9mohsE2wKtbaiD'], product: 'prod_OD6oUoJy4Vkoq7', coupon: '14kdyCSp' },
    premSub: { prices: ['price_1NdlcGDvAr9mohsEkIpop0uG'], product: 'prod_ODUuxPkQNir3Z2', coupon: 'PetNqLpF' },
  };

  private readonly testPrices = {
    // pricing is not accurate in development
    basicSub: { prices: ['price_1NRNMNDvAr9mohsEZ50muJeR'], product: 'prod_ODp0PzbxUWTSvf' },
    stdSub: { prices: ['price_1NSSn9DvAr9mohsEFJM6Mn81'], product: 'prod_OEwgdKCaGkjdWE', coupon: 'CcNHyn55' },
    premSub: { prices: ['price_1NSSnqDvAr9mohsEe4CeMWCu'], product: 'prod_OEwgdKCaGkjdWE' },
  };
  // this needs typing
  private readonly products: any;

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
    dev ? (this.products = this.testPrices) : (this.products = this.liveProducts);
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

  private async createSubCheckoutSession(subTier: keyof typeof this.products, customerId: string) {
    return await this.s.checkout.sessions.create({
      line_items: [
        {
          price: this.products[subTier].prices[0],
          quantity: 1,
        },
      ],
      discounts: [
        {
          coupon: this.products[subTier].coupon,
        },
      ],
      mode: 'subscription',
      success_url: `${CLIENT_HOST}/app/dash?sub-success=true`,
      cancel_url: `${CLIENT_HOST}/subscriptions?sub-failure=true`,
      payment_method_types: ['card'],
      customer: customerId,
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

  async createBasicTierCheckout(customerId: string) {
    return await this.createSubCheckoutSession('basicSub', customerId);
  }

  async createStdTierCheckout(customerId: string) {
    return await this.createSubCheckoutSession('stdSub', customerId);
  }

  async createPremTierCheckout(customerId: string) {
    return await this.createSubCheckoutSession('premSub', customerId);
  }

  getProducts() {
    if (dev) {
      return this.testPrices;
    } else {
      return this.liveProducts;
    }
  }

  async getPaymentIntent(paymentIntentId: string) {
    return await this.s.paymentIntents.retrieve(paymentIntentId);
  }

  async getMonthlySubRevenue() {
    const today = new Date();
    const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const summary = await this.s.balanceTransactions.list({
      type: 'charge',
      created: { gt: firstOfThisMonth.getTime() / 1000 },
    });
    let revAmount = 0;
    summary.data.map((obj) => {
      revAmount += obj.net;
    });
    return revAmount / 100;
  }

  async sendPayout(amount: number, stripeId: string, description: string) {
    try {
      const payout = this.s.transfers.create({
        amount,
        currency: 'usd',
        destination: stripeId,
        description,
      });
      return payout;
    } catch (err) {
      console.error(err);
    }
  }
}
