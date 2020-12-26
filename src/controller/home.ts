import { Request, Response } from 'express';
import { nextTick } from 'process';


export const index = (req: Request, res: Response, next: () => any) => {
  res.json({ msg: 'homepage' });
}
