import request from 'supertest';
import { app } from '../../../app';
import { closeConnection as closeDBConnection, initDBConnection } from '../../../database/dataSource';

const TEST_USER = { id: 'aafea35c-fa74-46eb-99da-561f1661dca5', email: 'sbtester@gmail.com', artistName: 'SantaBihh' };

describe('getAvatarHandler.ts', () => {
  beforeAll(async () => {
    await initDBConnection();
  });
  afterAll((done) => {
    closeDBConnection()
      .then(() => app.disable('cancel'))
      .then(() => done());
  });
  // success
  test('GET /avatar?id=<VALID_ID>', (done) => {
    request(app)
      .get(`/avatar?id=${TEST_USER.id}`)
      .then((res) => {
        const data = res.body;
        expect(data).toContain('images/');
        done();
      });
  });
  // invalid id / no user found
  test('GET /avatar?id=<INVALID_ID>', (done) => {
    request(app)
      .get(`/avatar?id=fasdlkfjlk`)
      .then((res) => {
        // should really be 404
        expect(res.status).toBe(503);
        done();
      });
  });
  // no id provided with request
  test('GET /avatar', (done) => {
    request(app)
      .get('/avatar')
      .then((res) => {
        expect(res.status).toBe(400);
        done();
      });
  });
});
