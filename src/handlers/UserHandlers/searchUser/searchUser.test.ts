import request from 'supertest';
import { app } from '../../../app';
import { closeConnection as closeDBConnection, initDBConnection } from '../../../database/dataSource';

describe('searchUserHandler.ts', () => {
  beforeAll(async () => {
    await initDBConnection();
  });
  afterAll((done) => {
    closeDBConnection()
      .then(() => app.disable('cancel'))
      .then(() => done());
  });
  test('GET /search?=bonta', (done) => {
    request(app)
      .get(`/search?search=bonta`)
      .then((res) => {
        const data = res.body;
        expect(data).toHaveProperty('users');
        const users = data.users;
        expect(Array.isArray(users));
        expect(users[0]).toHaveProperty('artistName', 'bontanamrown');
        done();
      });
  });
  test('GET /search?=asdlfkjasldfj', (done) => {
    // expect no matching search to return empty array
    request(app)
      .get(`/search?search=asdfasdfasdf`)
      .then((res) => {
        const data = res.body;
        expect(data).toHaveProperty('users');
        const users = data.users;
        expect(Array.isArray(users));
        expect(users.length === 0);
        done();
      });
  });
  test('GET /search', (done) => {
    // 400 status code when no query provided
    request(app)
      .get(`/search`)
      .then((res) => {
        expect(res.status).toBe(400);
        done();
      });
  });
});
