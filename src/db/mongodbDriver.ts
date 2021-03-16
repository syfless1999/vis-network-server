import mongoose from 'mongoose';
import config from 'src/config';
import { dsDebug } from 'src/util/debug';

const { mongodb_url: url } = config;

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

mongoose.connection.on('connected', function () {
  dsDebug(`Mongoose connection open to ${url}`);
});

mongoose.connection.on('error', function (err) {
  dsDebug(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', function () {
  dsDebug('Mongoose connection disconnected');
});


export default mongoose;
