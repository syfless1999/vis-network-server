import express, { Router } from 'express';
import cookieParser from 'cookie-parser';

import homeRouter from 'src/route/home';
import dataSourceRouter from 'src/route/datasource';
import taskRouter from 'src/route/task';
import networkRouter from 'src/route/network';
import { httpDebug } from 'src/util/debug';


// handle promise, async/await error automatically
require('express-async-errors');

const app = express();


app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.all('*', function (req, res, next) {
  // cors
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  // debug
  httpDebug(`${req.method} ${req.url}`);

  if (req.method == 'OPTIONS') {
    res.sendStatus(200);
  }
  else {
    next();
  }
});

// route
const apiRouter = Router();
apiRouter.use('/', homeRouter);
apiRouter.use('/datasource', dataSourceRouter);
apiRouter.use('/task', taskRouter);
apiRouter.use('/network', networkRouter);

app.use('/api', apiRouter);

// error handler
app.use(function (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  console.error(err);
  res.status(500).send(err.message);
});


export default app;
