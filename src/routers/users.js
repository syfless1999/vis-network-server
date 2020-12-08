const express = require('express');

const router = express.Router();

const users = Array.from({ length: 21 }).map((v, i) => ({
  id: i,
}));

router.get('/', (req, res) => {
  const { s = 0, e = 10 } = req.query;
  const result = users.slice(+s, +e);
  res.send(result);
});

router.get('/total', (req, res) => {
  res.send(`${users.length}`);
});

router.post('/', (req, res) => {
  const { id } = req.body;
  if (id) {
    users.push({ id });
  }
  res.send('success');
});

module.exports = router;
