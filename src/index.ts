import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import responseUtil from 'src/util/response';

import indexRouter from 'src/route/index';
import movieRouter from 'src/route/movie';

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/movies', movieRouter);

app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (err && err.status) {
    responseUtil.writeError(res, err);
  } else next(err);
});


export default app;