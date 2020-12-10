import _ from 'lodash';
import express from 'express';

function writeResponse(res: { status: (arg0: any) => { (): any; new(): any; send: { (arg0: string): void; new(): any; }; }; }, response: any, status: any) {
  res.status(status || 200).send(JSON.stringify(response));
};

function writeError(res: express.Response, err: any) {
  res
    .status(err.status || status || 400)
    .send(JSON.stringify(_.omit(err, ["status"])));
};


export default {
  writeResponse,
  writeError
}