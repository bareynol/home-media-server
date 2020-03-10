const express = require('express');
const {getAllData} = require('./utils');

const app = express()
const port = 3000

app.get('/stats', async (req, res) => {
  const stats = await getAllData();
  res.json(stats);
})

app.listen(port);
