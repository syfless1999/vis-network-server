import { Controller } from 'src/type/http';


export const index: Controller = (req, res, next) => {
  res.send('<h1>welcome vis-network</h1>');
}
