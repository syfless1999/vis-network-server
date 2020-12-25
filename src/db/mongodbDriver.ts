import mongoose from 'mongoose';
import config from 'src/config';

const { mongodb_url: url } = config;

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', function () {
  console.log(`Mongoose connection open to ${url}`);
});

mongoose.connection.on('error', function (err) {
  console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
  console.log('Mongoose connection disconnected');
});


export default mongoose;
