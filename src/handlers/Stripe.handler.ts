/// <reference types="stripe-event-types" />

import { Request, Response } from 'express';
import StripeClient from '../utils/StripeClient';
import Stripe from 'stripe';
import User from '../database/models/User.entity';
import { CustomerEventHandlers, InvoiceEventHandlers } from './StripeWebhooks.handler';
import { findUserById } from '../services/User.service';
import { CLIENT_HOST } from '../app';

const stripeClient = new StripeClient();

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  let reqBody = req.body;
  let event;

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
  // Handle the event
  console.log('Webhook type:', event?.type);
  if (event) {
    switch (event.type) {
      case 'customer.deleted':
        CustomerEventHandlers.deleted(event.data.object);
        break;

      case 'customer.subscription.deleted':
        CustomerEventHandlers.subscriptionDeleted(event.data.object);
        break;

      case 'customer.subscription.created':
        CustomerEventHandlers.subscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        CustomerEventHandlers.subscriptionUpdated(event.data.object);
        break;

      case 'invoice.created':
        InvoiceEventHandlers.created(event.data.object);
        break;

      case 'invoice.finalized':
        InvoiceEventHandlers.finalized(event.data.object);
        break;

      case 'invoice.finalization_failed':
        InvoiceEventHandlers.finalizationFailed(event.data.object);
        break;

      case 'invoice.paid':
        InvoiceEventHandlers.paid(event.data.object);
        break;

      case 'invoice.payment_action_required':
        InvoiceEventHandlers.paymentActionRequired(event.data.object);
        break;

      case 'invoice.payment_failed':
        // user sub status is automatically set to past_due
        // notify user that their payment failed and prompt them to update
        InvoiceEventHandlers.paymentFailed(event.data.object);
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

export const stripeConnectPortalHandler = async (req: Request, res: Response) => {
  const user = req.user;
  try {
    // get the users accountId
    // generate session link
    // send to client
  } catch (err) {
    console.error(err);
    return res.json({ message: 'An error occured creating a Stripe Connect account portal session', err });
  }
};

export const createStripeConnectAcctHandler = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(400).json({ message: 'No user provided with request' });
  }
  try {
    // check if user already has a connected account
    const userObj = await findUserById(user.id);
    if (!userObj) {
      return res.status(404).json({ message: 'No user found with that ID' });
    }
    // for testing
    userObj.stripeConnectId = '';
    await userObj.save();
    if (!userObj.stripeConnectId) {
      // create the account
      const account = await stripeClient.s.accounts.create({ type: 'express' });
      userObj.stripeConnectId = account.id;
      userObj.payoutMethod = 'stripe'
      await userObj.save();
      // create a portal session to redirect the user to
      const accountLink = await stripeClient.s.accountLinks.create({
        account: account.id,
        type: 'account_onboarding',
        return_url: `${CLIENT_HOST}/app/account`,
        // this should be a url that creates a new account link
        refresh_url: `${CLIENT_HOST}/app/account`,
      });
      return res.status(200).json({ url: accountLink.url });
    } else {
      return res.status(400).json({ message: 'User already has a Stripe Connected account.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({});
  }
};
