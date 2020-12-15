import { Document } from 'mongoose'
import mongoose from 'src/db/mongodbDriver';

export interface UserDocument extends Document {
  username: string;
  password: string;
}

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);


export default User;