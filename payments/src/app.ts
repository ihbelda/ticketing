import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError, currentUser } from '@anei/common'
import { createChargeRouter } from './routes/new';

const app = express();
app.set('trust proxy', true); // trust even coming from a proxy
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: false,
    // secure: process.env.NODE_ENV !== 'test'
  })
);
app.use(currentUser);

app.use(createChargeRouter);

// If you introduce a bad uri path (all methods get, post, ...)
app.all('*', async (req, res) => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
