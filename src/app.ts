import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import indexRouter from './routes';

dotenv.config();

const PORT = process.env.PORT || 8080;
// create express app
const app = express();
// middleware
app.use(cors());
// routes
app.use(indexRouter);
// start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
