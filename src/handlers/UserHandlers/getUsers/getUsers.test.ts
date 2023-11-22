import request from 'supertest';
import { app } from '../../../app';
import { closeConnection, initDBConnection } from '../../../database/dataSource';

describe('getUsersHandler.ts', () => {
  beforeAll(async () => {
    await initDBConnection();
  });
  afterAll((done) => {
    closeConnection()
      .then(() => app.disable('cancel'))
      .then(() => done());
  });
  test('GET /users?sort=name&order=DESC&take=5&skip=0', (done) => {
    request(app)
      .get('/users?sort=name&order=DESC&take=5&skip=0')
      .then(() => {
        done();
      });
  });
});
