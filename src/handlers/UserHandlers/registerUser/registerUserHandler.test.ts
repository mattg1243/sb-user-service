import request from 'supertest';
import { app } from '../../../app';

jest.mock('../../../services/User.service.ts');
import { initDBConnection, closeConnection } from '../../../database/dataSource';

let data = {
  email: 'iamhimothy@gmail.com',
  password: 'password1234',
  artistName: 'The One and Only',
  dateOfBirth: new Date(new Date().getFullYear() - 18),
};

jest.mock('../../../utils/StripeClient', () => {
  return jest.fn().mockImplementation(() => {
    return { createCustomer: jest.fn() };
  });
});

describe('registerUserHandler.ts', () => {
  beforeAll(async () => {
    await initDBConnection();
  });
  afterAll((done) => {
    closeConnection()
      .then(() => app.disable('cancel'))
      .then(() => done());
  });
  test('POST /register, <VALID_BODY>', (done) => {
    // request(app)
    //   .post('/register')
    //   .send(data)
    //   .expect(200)
    //   .then((res) => {
    //     console.log(res.body);
    //     done();
    //   });
    done();
  });
});
