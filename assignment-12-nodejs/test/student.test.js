const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { app } = require('../server');

test('GET /health returns server status', async () => {
  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('POST /api/students creates a student', async () => {
  const payload = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    age: 22,
    department: 'Computer Science'
  };

  const response = await request(app).post('/api/students').send(payload);
  assert.equal(response.status, 201);
  assert.equal(response.body.student.name, payload.name);
  assert.equal(response.body.student.email, payload.email);
});

test('GET /api/students returns an array', async () => {
  const response = await request(app).get('/api/students');
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.students));
});
