import { Response } from 'express';

function writeResponse(res: Response, response: any, status?: number) {
  res
    .status(status || 200)
    .send(JSON.stringify(response));
};

function writeError(res: Response, err: Error, status?: number) {
  res
    .status(status || 200)
    .send(JSON.stringify({ error: err.message }));
};


export default {
  writeResponse,
  writeError
}