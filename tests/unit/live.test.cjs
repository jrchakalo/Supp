const test = require('node:test');
const assert = require('node:assert/strict');

const room = require('../../.test-build/live/room.js');

test('sanitizeRoomCode normalizes and validates length', () => {
  assert.equal(room.sanitizeRoomCode(' ab-cd '), 'ABCD');
  assert.equal(room.sanitizeRoomCode('a'), null);
  assert.equal(room.sanitizeRoomCode('abcdefg'), null);
});

test('randomRoomCode uses the unambiguous alphabet', () => {
  const code = room.randomRoomCode();
  assert.equal(code.length, 5);
  assert.match(code, /^[A-HJ-NP-Z2-9]{5}$/);
});

test('prepareQuestion keeps the correct option aligned after shuffling', () => {
  const prepared = room.prepareQuestion({
    id: 'q1',
    tier: 1,
    text: 'Pergunta',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 2,
    explanation: 'Porque sim.',
  });
  assert.equal(prepared.options[prepared.correctIndex], 'C');
  assert.deepEqual([...prepared.options].sort(), ['A', 'B', 'C', 'D']);
});

test('scoreForAnswer rewards speed and floors at 100', () => {
  assert.equal(room.scoreForAnswer(0, 20_000), 1000);
  assert.equal(room.scoreForAnswer(10_000, 20_000), 550);
  assert.equal(room.scoreForAnswer(20_000, 20_000), 100);
});

test('buildQuestionRun creates a unique run of the requested size', () => {
  const run = room.buildQuestionRun('classic', 'medium', 8);
  assert.equal(run.length, 8);
  assert.equal(new Set(run.map((question) => question.id)).size, 8);
});

test('sortLeaderboard orders by total and then by name', () => {
  const rows = room.sortLeaderboard([
    { playerId: 'b', name: 'Bia', total: 10, streak: 0, gained: 0, correct: false },
    { playerId: 'a', name: 'Ana', total: 10, streak: 0, gained: 0, correct: false },
    { playerId: 'c', name: 'Caio', total: 30, streak: 0, gained: 0, correct: false },
  ]);
  assert.deepEqual(
    rows.map((row) => row.name),
    ['Caio', 'Ana', 'Bia']
  );
});
