import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';

const API_URL = 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_SECRET;

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
                features: ['PAYOUTS', 'PAYMENT'],
              },
            },
          },
        },
      ],
      products: ['EXPRESS_CHECKOUT'],
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
      console.log(res.data);
    } catch (err) {
      console.error(err);
    }
  }
}
