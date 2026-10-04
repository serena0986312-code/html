const express = require('express');
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentDB';

app.use(express.json());

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    age: { type: Number, required: true, min: 0 },
    department: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
const memoryStudents = [];
let databaseConnected = false;

function toPublicStudent(student) {
  if (!student) {
    return null;
  }

  const plain = student.toObject ? student.toObject() : { ...student };
  const { _id, __v, ...rest } = plain;

  return {
    ...rest,
    id: String(_id || plain.id || plain._id || randomUUID())
  };
}

function validateStudentPayload(payload = {}) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const department = String(payload.department || '').trim();
  const age = Number(payload.age);

  if (!name || !email || !department || !Number.isFinite(age) || age < 0) {
    const error = new Error('name, email, age, and department are required');
    error.statusCode = 400;
    throw error;
  }

  return {
    name,
    email,
    age,
    department
  };
}

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    databaseConnected = true;
    console.log(`MongoDB connected: ${MONGODB_URI}`);
  } catch (error) {
    databaseConnected = false;
    console.warn('MongoDB is not available. Using in-memory fallback data:', error.message);
  }
}

async function getAllStudents() {
  if (databaseConnected) {
    const students = await Student.find().lean();
    return students.map((student) => ({
      ...student,
      id: String(student._id)
    }));
  }

  return memoryStudents.map((student) => ({ ...student }));
}

async function createStudentRecord(data) {
  const payload = validateStudentPayload(data);

  if (databaseConnected) {
    const student = await Student.create(payload);
    return toPublicStudent(student);
  }

  const student = {
    id: randomUUID(),
    ...payload,
    createdAt: new Date().toISOString()
  };

  memoryStudents.push(student);
  return student;
}

async function findStudentById(id) {
  if (databaseConnected) {
    const student = await Student.findById(id).lean();
    if (!student) return null;

    return {
      ...student,
      id: String(student._id)
    };
  }

  return memoryStudents.find((student) => student.id === id) || null;
}

async function updateStudentRecord(id, data) {
  const payload = validateStudentPayload(data);

  if (databaseConnected) {
    const student = await Student.findByIdAndUpdate(
      id,
      payload,
      { new: true, runValidators: true }
    );

    return student ? toPublicStudent(student) : null;
  }

  const index = memoryStudents.findIndex((student) => student.id === id);
  if (index === -1) {
    return null;
  }

  memoryStudents[index] = {
    ...memoryStudents[index],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  return memoryStudents[index];
}

async function deleteStudentRecord(id) {
  if (databaseConnected) {
    const student = await Student.findByIdAndDelete(id);
    return student ? toPublicStudent(student) : null;
  }

  const index = memoryStudents.findIndex((student) => student.id === id);
  if (index === -1) {
    return null;
  }

  const [deletedStudent] = memoryStudents.splice(index, 1);
  return deletedStudent;
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Student backend is running' });
});

app.get(['/api/students', '/students'], async (req, res) => {
  try {
    const students = await getAllStudents();
    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch students' });
  }
});

app.post(['/api/students', '/students'], async (req, res) => {
  try {
    const student = await createStudentRecord(req.body || {});
    res.status(201).json({
      message: 'Student created successfully',
      student
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Failed to create student' });
  }
});

app.get(['/api/students/:id', '/students/:id', '/api/student/:id', '/student/:id'], async (req, res) => {
  try {
    const student = await findStudentById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({ student });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch student' });
  }
});

app.put(['/api/students/:id', '/students/:id', '/api/student/:id', '/student/:id'], async (req, res) => {
  try {
    const student = await updateStudentRecord(req.params.id, req.body || {});

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || 'Failed to update student' });
  }
});

app.delete(['/api/students/:id', '/students/:id', '/api/student/:id', '/student/:id'], async (req, res) => {
  try {
    const student = await deleteStudentRecord(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({
      message: 'Student deleted successfully',
      student
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete student' });
  }
});

module.exports = { app, Student, memoryStudents, connectDatabase };

if (require.main === module) {
  connectDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
