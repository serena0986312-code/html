# Student CRUD Backend

This project is a backend-only Node.js + Express + MongoDB assignment for managing students.

## Features
- Create student
- Get all students
- Get student by ID
- Update student
- Delete student

## Routes
- GET /health
- GET /api/students
- POST /api/students
- GET /api/students/:id
- PUT /api/students/:id
- DELETE /api/students/:id

## Run
```bash
npm install
npm start
```

## Environment
By default, the app tries to connect to MongoDB at:
```bash
mongodb://127.0.0.1:27017/studentDB
```

You can override it with:
```bash
MONGODB_URI=mongodb://127.0.0.1:27017/studentDB npm start
```
