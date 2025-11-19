// The Arrange, Act, Assert pattern (AAA) in unit tests
// Tests for studentService using ESM and Jest mocks
// Mock the repository module to avoid using a real MongoDB

import {jest, describe, it, expect, beforeEach} from '@jest/globals';

// Repository mocks scaffold
const repoMock = {
  createStudent: jest.fn(),
  findStudentById: jest.fn(),
  deleteStudentById: jest.fn(),
  updateStudent: jest.fn(),
  updateStudentScores: jest.fn(),
  findStudentByName: jest.fn(),
  countStudentsByName: jest.fn(),
  findStudentsByMinScore: jest.fn(),
};

// IMPORTANT: mock the dependency first, then import the module under test
await jest.unstable_mockModule('../repository/studentRepository.js', () => ({
  ...repoMock,
}));

const service = await import('../service/studentService.js');

beforeEach(() => {
  // Reset all mock functions state
  Object.values(repoMock).forEach(fn => fn.mockReset());
});

describe('studentService.addStudent', () => {
  it('returns false if a student with the same id already exists', async () => {
    repoMock.findStudentById.mockResolvedValue({_id: '42', name: 'Alice'});

    const result = await service.addStudent({id: '42', name: 'Alice', password: 'p'});

    expect(result).toBe(false);
    expect(repoMock.createStudent).not.toHaveBeenCalled();
    expect(repoMock.findStudentById).toHaveBeenCalledWith('42');
  });

  it('creates a student and returns true if the id is free', async () => {
    repoMock.findStudentById.mockResolvedValue(null);
    repoMock.createStudent.mockResolvedValue({_id: '1', name: 'Bob'});

    const payload = {id: '1', name: 'Bob', password: 'secret'};
    const result = await service.addStudent(payload);

    expect(result).toBe(true);
    expect(repoMock.createStudent).toHaveBeenCalledWith({_id: '1', name: 'Bob', password: 'secret'});
  });
});

describe('studentService.findStudent', () => {
  it('returns a student without the password field', async () => {
    repoMock.findStudentById.mockResolvedValue({_id: '7', name: 'Eve', password: '***'});

    const student = await service.findStudent('7');

    expect(repoMock.findStudentById).toHaveBeenCalledWith('7');
    expect(student).toMatchObject({_id: '7', name: 'Eve'});
    expect(student.password).toBeUndefined();
  });
});

describe('studentService.deleteStudent', () => {
  it('returns the deleted student without the password field', async () => {
    repoMock.deleteStudentById.mockResolvedValue({_id: '9', name: 'Jane', password: 'x'});

    const deleted = await service.deleteStudent('9');

    expect(repoMock.deleteStudentById).toHaveBeenCalledWith('9');
    expect(deleted).toMatchObject({_id: '9', name: 'Jane'});
    expect(deleted.password).toBeUndefined();
  });
});

describe('studentService.updateStudent', () => {
  it('omits the scores field in the response', async () => {
    repoMock.updateStudent.mockResolvedValue({_id: '11', name: 'Max', scores: {math: 100}});

    const updated = await service.updateStudent('11', {name: 'Max'});

    expect(repoMock.updateStudent).toHaveBeenCalledWith('11', {name: 'Max'});
    expect(updated).toMatchObject({_id: '11', name: 'Max'});
    expect(updated.scores).toBeUndefined();
  });
});

describe('studentService.addScore', () => {
  it('proxies the call to the repository', async () => {
    repoMock.updateStudentScores.mockResolvedValue({_id: '3', scores: {math: 90}});

    const res = await service.addScore('3', 'math', 90);

    expect(repoMock.updateStudentScores).toHaveBeenCalledWith('3', 'math', 90);
    expect(res).toEqual({_id: '3', scores: {math: 90}});
  });
});

describe('studentService.findByName', () => {
  it('returns a list of students without passwords', async () => {
    repoMock.findStudentByName.mockResolvedValue([
      {_id: '1', name: 'Eva', password: 'a'},
      {_id: '2', name: 'Eva', password: 'b'},
    ]);

    const list = await service.findByName('Eva');

    expect(repoMock.findStudentByName).toHaveBeenCalledWith('Eva');
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({_id: '1', name: 'Eva'});
    expect(list[0].password).toBeUndefined();
    expect(list[1]).toMatchObject({_id: '2', name: 'Eva'});
    expect(list[1].password).toBeUndefined();
  });
});

describe('studentService.countByNames', () => {
  it('passes arguments to the repository and returns a number', async () => {
    repoMock.countStudentsByName.mockResolvedValue(5);

    const count = await service.countByNames(['Ann', 'Bob']);

    expect(repoMock.countStudentsByName).toHaveBeenCalledWith(['Ann', 'Bob']);
    expect(count).toBe(5);
  });
});

describe('studentService.findByMinScore', () => {
  it('returns a list of students without passwords', async () => {
    repoMock.findStudentsByMinScore.mockResolvedValue([
      {_id: '1', name: 'Tom', password: 'x', scores: {math: 75}},
      {_id: '2', name: 'Lia', password: 'y', scores: {math: 80}},
    ]);

    const list = await service.findByMinScore('math', 70);

    expect(repoMock.findStudentsByMinScore).toHaveBeenCalledWith('math', 70);
    expect(list).toHaveLength(2);
    expect(list[0].password).toBeUndefined();
    expect(list[1].password).toBeUndefined();
  });
});
