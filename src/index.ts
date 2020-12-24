import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import responseUtil from 'src/util/response';
import homeRouter from 'src/route/home';
import movieRouter from 'src/route/movie';
import userRouter from 'src/route/user';

require('express-async-errors'); // handle promise, async/await error automatically

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
app.use('/', homeRouter);
app.use('/movie', movieRouter);
app.use('/user', userRouter);

app.use(function (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (err) {
    responseUtil.writeError(res, err);
  } else next(err);
});


export default app;
