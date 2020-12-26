import express, { Router } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import responseUtil from 'src/util/response';
import homeRouter from 'src/route/home';
import movieRouter from 'src/route/movie';
import userRouter from 'src/route/user';
import dataSourceRouter from 'src/route/datasource';

// handle promise, async/await error automatically
require('express-async-errors');

const app = express();

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// cors
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  if (req.method == 'OPTIONS') {
    res.send(200);
  }
  else {
    next();
  }
});

// route
const apiRouter = Router();
apiRouter.use('/', homeRouter);
apiRouter.use('/movie', movieRouter);
apiRouter.use('/user', userRouter);
apiRouter.use('/datasource', dataSourceRouter);

app.use('/api', apiRouter);

app.use(function (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (err) {
    responseUtil.writeError(res, err);
  } else next(err);
});


export default app;
