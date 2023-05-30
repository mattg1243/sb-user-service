import request from 'supertest';
import { app } from '../src/app';
import { closeConnection as closeDBConnection, initDBConnection } from '../src/database/dataSource';
import { signJwt } from '../src/jwt';

const TEST_USER = 'aafea35c-fa74-46eb-99da-561f1661dca5';
const TEST_TOKEN = signJwt(TEST_USER, 'ACCESS_PRIVATE_KEY', { expiresIn: 10000 });

describe('User handlers', () => {
  beforeAll(async () => {
    await initDBConnection();
  });
  afterAll((done) => {
    closeDBConnection()
      .then(() => app.disable('cancel'))
      .then(() => done());
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
  test('POST /login', (done) => {
    request(app)
      .post('/login')
      .send({ email: 'sbtester@gmail.com' })
      .then((res) => {
        expect(res.status).toBe(200);
        done();
      });
  });
  // need to write delete user route to clean up register test
  test('GET /followers', (done) => {
    request(app)
      .get(`/followers?user=${TEST_USER}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('followers');
        done();
      });
  });
  test('GET /following', (done) => {
    request(app)
      .get(`/following?user=${TEST_USER}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('following');
        done();
      });
  });
  test('GET /isfollowing', (done) => {
    request(app)
      .get(`/isfollowing?user=${TEST_USER}&userToCheck=c690083b-4597-478a-9e15-68c61789807c`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('isFollowing', true);
      });
    request(app)
      .get(`/isfollowing?user=${TEST_USER}&userToCheck=abc-123`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('isFollowing', false);
        done();
      });
  });
  test('POST /update', (done) => {
    request(app)
      .post('/update')
      .set('Authorization', TEST_TOKEN)
      .send({ artistName: 'Himothy', bio: 'Im Him' })
      .then((res) => {
        expect(res.status).toBe(200);
        console.log(res.body);
      });
  });
});
