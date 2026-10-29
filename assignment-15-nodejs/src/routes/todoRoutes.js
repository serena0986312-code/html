const express = require('express');
const {
  createTodo,
  getAllTodos,
  getTodoById,
  updateTodoById,
  deleteTodoById
} = require('../controllers/todoController');

const router = express.Router();

router.post('/todos', createTodo);
router.get('/todos', getAllTodos);
router.get('/todos/:id', getTodoById);
router.put('/todos/:id', updateTodoById);
router.delete('/todos/:id', deleteTodoById);

module.exports = router;
