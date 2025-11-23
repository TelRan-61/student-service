// Controller tests using Jest, Supertest and ESM mocks

import {jest, describe, it, expect, beforeEach} from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Service mock scaffold
const serviceMock = {
  addStudent: jest.fn(),
  findStudent: jest.fn(),
  deleteStudent: jest.fn(),
  updateStudent: jest.fn(),
  addScore: jest.fn(),
  findByName: jest.fn(),
  countByNames: jest.fn(),
  findByMinScore: jest.fn(),
};

// IMPORTANT: mock the dependency BEFORE importing the router/controller
await jest.unstable_mockModule('../service/studentService.js', () => ({
  ...serviceMock,
}));

// Now import the router that wires endpoints to the controller
const studentRouter = (await import('../routes/studentRoutes.js')).default;

// Build a minimal express app for Supertest
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(studentRouter);
  return app;
}

beforeEach(() => {
  // Reset all mocks state between tests
  Object.values(serviceMock).forEach(fn => fn.mockReset());
});

describe('POST /student (addStudent)', () => {
  it('returns 201 when a student is created', async () => {
    serviceMock.addStudent.mockResolvedValue(true);

    const res = await request(buildApp())
      .post('/student')
      .send({id: 1, name: 'Ann', password: 'secret'});

    expect(res.status).toBe(201);
    expect(serviceMock.addStudent).toHaveBeenCalledWith({id: 1, name: 'Ann', password: 'secret'});
  });

  it('returns 409 when a student with id already exists', async () => {
    serviceMock.addStudent.mockResolvedValue(false);

    const res = await request(buildApp())
      .post('/student')
      .send({id: 1, name: 'Ann', password: 'secret'});

    expect(res.status).toBe(409);
  });

  it('returns 400 on validation error (missing password)', async () => {
    const res = await request(buildApp())
      .post('/student')
      .send({id: 1, name: 'Ann'});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(serviceMock.addStudent).not.toHaveBeenCalled();
  });
});

describe('GET /student/:id (findStudent)', () => {
  it('returns 200 and a student when found', async () => {
    serviceMock.findStudent.mockResolvedValue({_id: 7, name: 'Eve'});

    const res = await request(buildApp()).get('/student/7');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({_id: 7, name: 'Eve'});
    expect(serviceMock.findStudent).toHaveBeenCalledWith(7);
  });

  it('returns 404 when student is not found', async () => {
    serviceMock.findStudent.mockResolvedValue(null);

    const res = await request(buildApp()).get('/student/999');

    expect(res.status).toBe(404);
  });
});

describe('PATCH /score/student/:id (addScore)', () => {
  it('returns 204 when score is added', async () => {
    serviceMock.addScore.mockResolvedValue(true);

    const res = await request(buildApp())
      .patch('/score/student/5')
      .send({examName: 'math', score: 90});

    expect(res.status).toBe(204);
    expect(serviceMock.addScore).toHaveBeenCalledWith(5, 'math', 90);
  });

  it('returns 400 on validation error (score out of range)', async () => {
    const res = await request(buildApp())
      .patch('/score/student/5')
      .send({examName: 'math', score: 120});

    expect(res.status).toBe(400);
    expect(serviceMock.addScore).not.toHaveBeenCalled();
  });
});

describe('PATCH /student/:id (updateStudent)', () => {
  it('returns 400 on validation error (invalid type)', async () => {
    const res = await request(buildApp())
      .patch('/student/3')
      .send({name: 123});

    expect(res.status).toBe(400);
    expect(serviceMock.updateStudent).not.toHaveBeenCalled();
  });
});

describe('GET /quantity/students (countByNames)', () => {
  it('accepts names as array and returns count', async () => {
    serviceMock.countByNames.mockResolvedValue(2);

    const res = await request(buildApp())
      .get('/quantity/students')
      .query({names: ['Ann', 'Bob']});

    expect(res.status).toBe(200);
    expect(res.body).toBe(2);
    expect(serviceMock.countByNames).toHaveBeenCalledWith(['Ann', 'Bob']);
  });

  it('accepts names as single string and returns count', async () => {
    serviceMock.countByNames.mockResolvedValue(1);

    const res = await request(buildApp())
      .get('/quantity/students')
      .query({names: 'Ann'});

    expect(res.status).toBe(200);
    expect(res.body).toBe(1);
    expect(serviceMock.countByNames).toHaveBeenCalledWith(['Ann']);
  });
});
