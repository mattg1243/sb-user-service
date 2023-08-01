import Stripe from 'stripe';
export default class StripeClient {
  constructor() {
    console.log('Mock stripe client constructed');
  }

  async createCustomer(email: string) {
    return { id: '12345asdfg' };
  }
}
