import Stripe from 'stripe';
import { getUserByStripeCustomerId, addCredits } from '../services/User.service';
import StripeClient from '../utils/StripeClient';
import { BASIC_SUB_MONTHLY_CREDITS, PREM_SUB_MONTHLY_CREDITS, STD_SUB_MONTHLY_CREDITS } from '../config';
import { notifyMeOnNewSub } from '../utils/sendgridConfig';

const stripeClient = new StripeClient();

let customerIdTest = 'cus_ODUn4W1ILZIDPj';

/**
 * Encapsulates all Stripe webhook events that provide a
 * customer OR subscription object, including subscription related events.
 */
export namespace CustomerEventHandlers {
  export const deleted = async (customerObj: Stripe.Customer) => {
    try {
      const user = await getUserByStripeCustomerId(customerObj.id);
      user.stripeCustomerId = '';
      user.setSubStatus('canceled');
      user.save();
    } catch (err) {
      console.error(err);
    }
  };

  export const subscriptionDeleted = async (subscriptionObj: Stripe.Subscription) => {
    try {
      const user = await getUserByStripeCustomerId(subscriptionObj.customer as string);
      // this may be redundant as the subscription.update event is probably also fired in this case
      user.setSubStatus(subscriptionObj.status);
      user.save();
    } catch (err) {
      console.error(err);
    }
  };

  export const subscriptionCreated = async (subscriptionObj: Stripe.Subscription) => {
    try {
      const user = await getUserByStripeCustomerId(subscriptionObj.customer as string);
      user.setSubStatus(subscriptionObj.status);
      user.save();
    } catch (err) {
      console.error(err);
    }
  };

  export const subscriptionUpdated = async (subscriptionObj: Stripe.Subscription) => {
    try {
      const user = await getUserByStripeCustomerId(subscriptionObj.customer as string);
      user.setSubStatus(subscriptionObj.status);
      user.save();
    } catch (err) {
      console.error(err);
    }
  };
}

/**
 * Encapsulates all Stripe webhook events that provide an
 * invoice object, including payments and payment failures.
 */
export namespace InvoiceEventHandlers {
  // not currently used, should email the invoice / store link to show on frontend
  export const created = async (invoiceObj: Stripe.Invoice) => {};
  export const finalized = async (invoiceObj: Stripe.Invoice) => {};
  export const finalizationFailed = async (invoiceObj: Stripe.Invoice) => {};
  export const paymentActionRequired = async (invoiceObj: Stripe.Invoice) => {};
  export const paymentFailed = async (invoiceObj: Stripe.Invoice) => {};
  export const paid = async (invoiceObj: Stripe.Invoice) => {
    try {
      const billingReason = invoiceObj.billing_reason;
      const subId = invoiceObj.subscription as string;
      const subscription = await stripeClient.s.subscriptions.retrieve(subId);
      let customer: string;
      // assign the default payment method as the initial payment method
      if (billingReason == 'subscription_create') {
        const paymentIntent = stripeClient.getPaymentIntent(invoiceObj.payment_intent as string);
        await stripeClient.s.subscriptions.update(subId as string, {
          default_payment_method: (await paymentIntent).payment_method as string,
        });
      }
      // allocate credits if the subscription is being created / renewed with this payment
      if (billingReason == 'subscription_create' || billingReason == 'subscription_cycle') {
        const user = await getUserByStripeCustomerId(subscription.customer as string);
        const products = stripeClient.getProducts();
        switch (subscription.items.data[0].price.product) {
          case products.basicSub.product:
            addCredits(user._id, BASIC_SUB_MONTHLY_CREDITS);
            user.subTier = 'basic';
            await user.save();
            notifyMeOnNewSub(user.email, 'basic');
            break;

          case products.stdSub.product:
            addCredits(user._id, STD_SUB_MONTHLY_CREDITS);
            user.subTier = 'std';
            await user.save();
            notifyMeOnNewSub(user.email, 'standard');
            break;

          case products.premSub.product:
            addCredits(user._id, PREM_SUB_MONTHLY_CREDITS);
            user.subTier = 'prem';
            await user.save();
            notifyMeOnNewSub(user.email, 'premium');
            break;
        }
      }
      // catch subscription_updated
      if (billingReason == 'subscription_update') {
        CustomerEventHandlers.subscriptionUpdated(subscription);
      }
    } catch (err) {
      console.error(err);
    }
  };
}
