import router from '../src/routes';
import request from 'supertest';
import express from 'express';

const app = express();
app.use('/', router);

test('index route works', (done) => {
  request(app).get('/').expect('Content-Type', /json/);
  done();
});
