import { Request, Response } from 'express';


export const index = (req: Request, res: Response, next: () => any) => {
  res.json({ msg: 'homepage' });
}
