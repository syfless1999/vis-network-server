import { Request, Response } from 'express';
import { getSession } from 'src/db/neo4jDriver';

export const getTotal = async (req: Request, res: Response) => {
  const session = getSession(req);
  const txc = session.beginTransaction();
  try {
    const result = await txc.run('MATCH (m:Movie) RETURN m.tagline as tagline LIMIT 3')
    const names = result.records.map((record) => record.get('tagline'));
    await session.close();
    res.status(200).send(JSON.stringify(names));
  } catch (error) {
    res.status(500).send('error neo4j');
  }
}