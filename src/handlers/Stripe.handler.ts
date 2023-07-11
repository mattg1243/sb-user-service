/// <reference types="stripe-event-types" />

import { Request, Response } from 'express';
import StripeClient from '../utils/StripeClient';
import Stripe from 'stripe';
import { getUserByStripCustomerId } from '../services/User.service';
import User from '../database/models/User.entity';

const stripeClient = new StripeClient();

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  let reqBody = req.body;
  let event;
  // const customer = req.body.data.object.customer;
  // Replace this endpoint secret with your endpoint's unique secret
  // If you are testing with the CLI, find the secret by running 'stripe listen'
  // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
  // at https://dashboard.stripe.com/webhooks
  const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = req.headers['stripe-signature'] as string;
    try {
      event = (await stripeClient.constructWebhookEvent(
        reqBody,
        signature,
        endpointSecret
      )) as Stripe.DiscriminatedEvent;
    } catch (err: any) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }
  }
  let invoice;
  let subscription;
  let status;
  // Handle the event
  console.log('Webhook type:', event?.type);
  if (event) {
    let customerIdTest = 'cus_ODUn4W1ILZIDPj';
    let user: User;
    switch (event.type) {
      // no trials for now
      // case 'customer.subscription.trial_will_end':
      //   subscription = event.data.object;
      //   status = subscription.status;
      //   customer = subscription.customer
      //   console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription trial ending.
      // handleSubscriptionTrialEnding(subscription);
      // break;
      case 'customer.deleted':
        try {
          user = await getUserByStripCustomerId(event.data.object.id);
          user.setSubStatus('canceled');
          user.save();
        } catch (err) {
          console.error(err);
        }
        break;
        
      case 'customer.subscription.deleted':
        try {
          subscription = event.data.object;
          status = (subscription as Stripe.Subscription).status;
          // get user by customer id
          user = await getUserByStripCustomerId(event.data.object.id);
          user.setSubStatus('canceled');
          user.save();
          console.log(`Subscription status is ${status}.`);
        } catch (err) {
          console.error(err);
        }
        break;
      case 'customer.subscription.created':
        try {
          subscription = event.data.object;
          status = subscription.status;
          user = await getUserByStripCustomerId(event.data.object.id);
          user.setSubStatus(status);
          console.log(subscription.items.data[0].price.id);
        } catch (err) {
          console.error(err);
        }
        // check to see what tier subscription in order to add correct amount of credits
        const subPriceId = subscription.items.data[0].price.id;
        const products = stripeClient.getProducts();
        switch (subPriceId) {
          case products.basicSub:
            console.log('basic sub created');
            // grant 3 credits
            // change subTier to 'basic'
            break;

          case products.stdSub:
            console.log('std sub created');
            // grant 7 credits
            // change user.subTier to 'std'
            // change user.stripeSubStatus
            break;

          case products.premSub:
            console.log('prem sub created');

          default:
            console.error('No subscription matches the provided price_id');
            break;
        }
        user.save();
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription created.
        // handleSubscriptionCreated(subscription);
        break;
      case 'customer.subscription.updated':
        try {
          subscription = event.data.object;
          status = subscription.status;
          user = await getUserByStripCustomerId(event.data.object.id);
          user.setSubStatus(status);
          console.log(`Subscription status is ${status}.`);
        } catch (err) {
          console.error(err);
        }
        // Then define and call a method to handle the subscription update.
        // handleSubscriptionUpdated(subscription);
        break;

      case 'invoice.created':
        invoice = event.data.object;
        break;

      case 'invoice.finalized':
        // email the invoice to the user, if stripe doesnt do this already
        try {
          invoice = event.data.object;
          user = await getUserByStripCustomerId(event.data.object.customer as string);
        } catch (err) {
          console.error(err);
        }
        break;

      case 'invoice.finalization_failed':
        invoice = event.data.object;
        break;

      case 'invoice.paid':
        invoice = event.data.object;
        if (invoice['billing_reason'] == 'subscription_create') {
          const subId = invoice.subscription;
          const paymentIntentId = invoice.payment_intent;
          // set payment method that created the subscription as default payment method
          try {
            const paymentIntent = stripeClient.getPaymentIntent(paymentIntentId as string);
            const subscription = await stripeClient.s.subscriptions.update(subId as string, {
              default_payment_method: (await paymentIntent).payment_method as string,
            });
          } catch (err) {
            console.error(err);
          }
        }
        break;

      case 'invoice.payment_action_required':
        invoice = event.data.object;
        break;

      case 'invoice.payment_failed':
        // user sub status is automatically set to past_due
        // notify user that their payment failed and prompt them to update
        invoice = event.data.object;
        console.log(req.body);
        break;

      case 'invoice.payment_succeeded':
        invoice = event.data.object;
        if (invoice['billing_reason'] == 'subscription_create') {
          const subId = invoice.subscription;
          const paymentIntentId = invoice.payment_intent;
          // set payment method that created the subscription as default payment method
          try {
            const paymentIntent = stripeClient.getPaymentIntent(paymentIntentId as string);
            const subscription = await stripeClient.s.subscriptions.update(subId as string, {
              default_payment_method: (await paymentIntent).payment_method as string,
            });
          } catch (err) {
            console.error(err);
          }
        }
        break;

      case 'invoice.upcoming':
        invoice = event.data.object;
        break;

      case 'invoice.updated':
        invoice = event.data.object;
        break;

      case 'payment_intent.created':
        break;

      case 'payment_intent.succeeded':
        break;

      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);

      // other event types
      // customer.subscription.paused, customer.subscription.resumed, customer.subscription.trial_will_end
    }
  }
  // Return a 200 response to acknowledge receipt of the event
  res.send();
};

export const stripeCustomerPortalHandler = async (req: Request, res: Response) => {
  const customerId = req.query.customerId as string;
  if (!customerId) {
    return res.status(400).json({ message: 'No customerId provided with request' });
  }
  try {
    const portalSessionUrl = (await stripeClient.createPortalSession(customerId)).url;
    return res.status(200).json({ url: portalSessionUrl });
  } catch (err) {
    return res.status(500).json({ message: 'And error occurred creating a Stripe portal session', err });
  }
};
