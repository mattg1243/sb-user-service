import request from 'supertest';
import { app } from '../src/app';
import { initDBConnection } from '../src/database/dataSource';

const TEST_USER = 'aafea35c-fa74-46eb-99da-561f1661dca5';

describe('User handlers', () => {
  beforeAll(async () => {
    await initDBConnection();
  });
  test('GET /?id', (done) => {
    request(app)
      .get(`/?id=${TEST_USER}`)
      .then((res) => {
        const data = res.body;
        expect(data).toHaveProperty('_id');
        expect(data).toHaveProperty('artistName');
        expect(data).toHaveProperty('email');
        done();
      });
  });
  test('GET /avatar', (done) => {
    request(app)
      .get(`/avatar?id=${TEST_USER}`)
      .then((res) => {
        const data = res.body;
        expect(data).toContain('images/');
        done();
      });
  });
});
