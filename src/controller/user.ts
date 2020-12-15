import { Request, Response } from 'express';
import User from 'src/model/User'

export const create = (req: Request, res: Response) => {
  const newUser = new User({
    username: req.body.username,
    password: req.body.password,
  });
  newUser.save((err) => {
    if (err) {
      console.error(err);
    }
    res.status(500).json({ message: 'fail' });
  });
}

export const getTotal = (req: Request, res: Response) => {
  User.find((err, users) => {
    if (err) {
      res.status(500).json({ message: 'fail' });
    }
    res.json({
      message: 'success',
      users,
    });
  })
}