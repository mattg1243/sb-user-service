import axios from 'axios';
import dotenv from 'dotenv';
import { CLIENT_HOST } from '../app';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';

const API_URL = dev ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_SECRET;

// private interfaces
export interface ICreatePayoutItemArgs {
  paypalId: string;
  amount: number;
}

interface IPayoutItem {
  receiver: string;
  amount: {
    currency: string;
    value: number;
  };
  recipient_type: string;
}
/**
 * All PayPal logic utilized by the user service. This service does NOT handle
 * sending out payment but does handle connecting and managing accounts.
 */
export default class PayPalClient {
  private token: string;

  constructor() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.log('No PayPal client ID / secret detected when insantiating PayPalClient');
      return;
    }

    const authCode = `${Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')}`;

    axios
      .post(
        `${API_URL}/v1/oauth2/token`,
        { grant_type: 'client_credentials' },
        { headers: { Authorization: `Basic ${authCode}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      .then((res) => {
        this.token = res.data.access_token;
      })
      .catch((err) => console.error(err));
  }

  async getConnectAccountUrl(artistName: string, userId: string) {
    const reqJson = {
      individual_owners: [
        {
          names: [
            {
              full_name: artistName,
            },
          ],
        },
      ],
      tracking_id: userId,
      operations: [
        {
          operation: 'API_INTEGRATION',
          api_integration_preference: {
            rest_api_integration: {
              integration_method: 'PAYPAL',
              integration_type: 'THIRD_PARTY',
              third_party_details: {
                features: ['PAYMENT', 'REFUND'],
              },
            },
          },
        },
      ],
      products: ['EXPRESS_CHECKOUT'],
      partner_config_override: {
        return_url: `${CLIENT_HOST}/app/account?paypal-connect=success`,
      },
      legal_consents: [
        {
          type: 'SHARE_DATA_CONSENT',
          granted: true,
        },
      ],
    };

    try {
      const res = await axios.post(`${API_URL}/v2/customer/partner-referrals`, reqJson, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return res.data;
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Creates a batch of payout items and initiates batch payment
   * @param payments - array of payout items
   * @param payoutId - payout database id to store in paypal
   * @returns batch payout response from api
   */
  async sendPayout(payment: IPayoutItem, payoutId: string) {
    try {
      const res = await axios.post(
        `${API_URL}/v1/payments/payouts`,
        { items: [payment], sender_batch_header: { sender_batch_id: payoutId } },
        { headers: { Authorization: `Bearer ${this.token}` } }
      );
      return res.data;
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  }

  /**
   * Creates a payout object to be sent to the api to initiate a payout
   * @param args - composed of paypalId and amount
   * @returns paypal payout item per api spec
   */
  createPayoutItem(args: ICreatePayoutItemArgs): IPayoutItem {
    return {
      receiver: args.paypalId,
      amount: {
        currency: 'USD',
        value: args.amount,
      },
      recipient_type: 'PAYPAL_ID',
    };
  }
}
