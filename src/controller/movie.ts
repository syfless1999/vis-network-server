import { Request, Response } from 'express';
import { getSession } from 'src/db/neo4jDriver';

export const getTotal = async (req: Request, res: Response) => {
  try {
    const session = getSession(req);
    const result = await session.readTransaction(
      (txc) =>
        txc.run('MATCH (m:Movie) RETURN m.tagline LIMIT 10'));
    const names = result.records.map((record) => record.get('m.tagline'));
    res.status(200).send(JSON.stringify(names));
  } catch (error) {
    res.status(500).send('error neo4j');
  }

}