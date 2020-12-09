const express = require('express');
const driver = require('../db/neo4jDriver');
// const Movie = require('../model/movie');

const router = express.Router();

router.get('/total', (req, res) => {
  driver.getSession(req)
    .readTransaction((txc) => txc.run('MATCH (m:Movie) RETURN m.tagline LIMIT 10'))
    .then((result) => {
      const names = result.records.map((record) => record.get('m.tagline'));
      // console.log(names);
      res.status(200).send(JSON.stringify(names));
    }).catch((e) => {
      console.error(e);
    });
});

module.exports = router;
