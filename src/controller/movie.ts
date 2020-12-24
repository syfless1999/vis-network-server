import { Request, Response } from 'express';
import { getSession } from 'src/db/neo4jDriver';

export const getTotal = (req: Request, res: Response) => {
  getSession(req)
    .readTransaction((txc) => txc.run('MATCH (m:Movie) RETURN m.tagline LIMIT 10'))
    .then((result) => {
      const names = result.records.map((record) => record.get('m.tagline'));
      res.status(200).send(JSON.stringify(names));
    }).catch((e) => {
      res.status(500).send('error neo4j');
    });
}