const express = require('express');
const todoRoutes = require('./routes/todoRoutes');

const app = express();

app.use(express.json());
app.use('/', todoRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Simple To-Do App API is running'
  });
});

module.exports = app;
