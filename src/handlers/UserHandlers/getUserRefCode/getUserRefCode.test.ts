import request from 'supertest';
import { app } from '../../../app';
import { closeConnection, initDBConnection } from '../../../database/dataSource';

const TEST_USER = { id: 'aafea35c-fa74-46eb-99da-561f1661dca5', email: 'sbtester@gmail.com', artistName: 'SantaBihh' };

describe('getUserRefCode', () => {
  beforeAll(async () => {
    await initDBConnection();
  });
  afterAll((done) => {
    closeConnection()
      .then(() => app.disable('cancel'))
      .then(() => done());
  });
  test('GET /sub-ref-code', (done) => {
    request(app)
    .get('/sub-ref-code')
  })
});
