import { Request, Response } from 'express';

type Controller = (req: Request, res: Response, next: (error: Error) => any) => Promise<unknown> | unknown;