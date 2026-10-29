const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Todo = require('../src/models/Todo');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Todo API', () => {
  beforeEach(async () => {
    await Todo.deleteMany({});
  });

  test('POST /todos should create a todo', async () => {
    const res = await request(app)
      .post('/todos')
      .send({
        title: 'Learn Node.js',
        description: 'Complete the backend assignment',
        completed: false
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Learn Node.js');
  });

  test('GET /todos should fetch all todos', async () => {
    await Todo.create({
      title: 'Read book',
      description: 'Finish chapter 1',
      completed: true
    });

    const res = await request(app).get('/todos');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  test('PUT /todos/:id should update a todo', async () => {
    const todo = await Todo.create({
      title: 'Write code',
      description: 'Build API',
      completed: false
    });

    const res = await request(app)
      .put(`/todos/${todo._id}`)
      .send({
        title: 'Write code',
        description: 'Build API and test it',
        completed: true
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.description).toBe('Build API and test it');
  });

  test('DELETE /todos/:id should remove a todo', async () => {
    const todo = await Todo.create({
      title: 'Submit assignment',
      description: 'Upload repo link',
      completed: false
    });

    const res = await request(app).delete(`/todos/${todo._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Todo deleted successfully');
  });
});
