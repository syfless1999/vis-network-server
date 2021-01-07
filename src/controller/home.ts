import { Request, Response } from 'express';


export const index = (req: Request, res: Response, next: () => any) => {
  res.send('<h1>welcome vis-network</h1>');
}
