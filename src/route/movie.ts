import express from 'express';
import { getSession } from 'src/db/neo4jDriver';

const router = express.Router();

router.get('/total', (req, res) => {
  getSession(req)
    .readTransaction((txc) => txc.run('MATCH (m:Movie) RETURN m.tagline LIMIT 10'))
    .then((result) => {
      const names = result.records.map((record) => record.get('m.tagline'));
      res.status(200).send(JSON.stringify(names));
    }).catch((e) => {
      console.error(e);
    });
});

export default router;
