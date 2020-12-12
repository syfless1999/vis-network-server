import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import responseUtil from 'src/util/response';

import * as homeController from 'src/controller/home';
import * as movieController from 'src/controller/movie';
require('express-async-errors'); // handle promise, async/await error automatically

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// route
app.get('/', homeController.index);
app.get('/movies/total', movieController.getTotal);

app.use(function (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (err) {
    responseUtil.writeError(res, err);
  } else next(err);
});


export default app;
