import request from 'supertest';
import { app } from '../../../app';
import { closeConnection, initDBConnection } from '../../../database/dataSource';

const TEST_USER = { id: 'aafea35c-fa74-46eb-99da-561f1661dca5', email: 'sbtester@gmail.com', artistName: 'SantaBihh' };
describe('getUserHandler.ts', () => {
  beforeAll(async () => {
    await initDBConnection();
  });
  afterAll((done) => {
    closeConnection()
      .then(() => app.disable('cancel'))
      .then(() => done());
  });
  test('GET /?id', (done) => {
    request(app)
      .get(`/?id=${TEST_USER.id}`)
      .then((res) => {
        const data = res.body;
        expect(data).toHaveProperty('_id');
        expect(data).toHaveProperty('artistName');
        expect(data).toHaveProperty('email');
        done();
      });
  });
});
