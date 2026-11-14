const test = require('node:test');
const assert = require('node:assert/strict');

const report = require('../../.test-build/aula/class-report.js');

const template = {
  prefix: 'Projeto 6 ; Aula 3 -',
  learning: 'Os alunos entenderam checkpoints e respawn.',
  activity: 'Foram realizadas atividades no Roblox Studio.',
  praise: 'A turma testou com autonomia.',
};

test('composes the two standard sentences', () => {
  const text = report.composeClassReport({ template, present: ['Ana'], goodPerformance: false });
  assert.equal(
    text,
    'Projeto 6 ; Aula 3 - Os alunos entenderam checkpoints e respawn. Foram realizadas atividades no Roblox Studio.'
  );
});

test('adds the third sentence only with good performance', () => {
  const text = report.composeClassReport({ template, present: ['Ana'], goodPerformance: true });
  assert.ok(text.endsWith('A turma testou com autonomia.'));
});

test('marks an empty class explicitly', () => {
  const text = report.composeClassReport({ template, present: [], goodPerformance: true });
  assert.ok(text.endsWith('Nenhum aluno compareceu.'));
});

test('normalizes, dedupes and trims attendance', () => {
  const names = report.normalizeAttendance(['  Ana  ', 'ana', '', 'Bruno', 42]);
  assert.deepEqual(names, ['Ana', 'Bruno']);
});

test('normalizes student ids for the attendance toggles', () => {
  assert.deepEqual(report.normalizeStudentIds(['a', 'a', '', 'b', 3]), ['a', 'b']);
  assert.deepEqual(report.normalizeStudentIds(null), []);
});

test('normalizes students, feedbacks and material', () => {
  const students = report.normalizeStudents([
    {
      id: 'a',
      name: ' Ana ',
      present: true,
      feedbacks: ['Collaboration', 'Self-Control', 'Unknown'],
      hasMaterial: true,
    },
    { id: 'b', name: 'Bruno', present: false, feedbacks: [], hasMaterial: false },
    { id: 'c', name: '' },
  ]);
  assert.equal(students.length, 2);
  assert.equal(students[0].name, 'Ana');
  assert.deepEqual(students[0].feedbacks, ['Collaboration', 'Self-Control']);
  assert.equal(students[0].hasMaterial, true);
  assert.equal(students[1].present, false);
});

test('exposes the platform behavioral feedback catalog', () => {
  const collaboration = report.feedbackByValue('Collaboration');
  assert.equal(collaboration.label, 'Colaboração');
  assert.equal(collaboration.points, 80);
  assert.equal(report.feedbackByValue('Creativity').points, 80);
  assert.equal(report.feedbackByValue('Disrespect').nature, 'bad');
});

test('rejects malformed templates', () => {
  assert.equal(report.isValidTemplate(template), true);
  assert.equal(report.isValidTemplate({ prefix: 'x' }), false);
  assert.equal(report.isValidTemplate(null), false);
});

test('reads the stored report and ignores malformed notes', () => {
  const stored = report.readStoredClassReport(
    JSON.stringify({
      legacyNotes: 'keep',
      classReport: {
        text: 'Relatório salvo.',
        present: ['Ana'],
        presentStudentIds: ['student-1'],
        goodPerformance: true,
        at: '2026-11-14T00:00:00.000Z',
      },
    })
  );
  assert.equal(stored.text, 'Relatório salvo.');
  assert.deepEqual(stored.present, ['Ana']);
  assert.deepEqual(stored.presentStudentIds, ['student-1']);
  assert.equal(report.readStoredClassReport('not json'), null);
  assert.equal(report.readStoredClassReport(JSON.stringify({ audit: [] })), null);
});
