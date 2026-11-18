const test = require('node:test');
const assert = require('node:assert/strict');

const calendar = require('../../.test-build/agenda/calendar.js');
const dashboard = require('../../.test-build/agenda/dashboard.js');
const holidays = require('../../.test-build/agenda/holidays.js');
const removed = require('../../.test-build/agenda/removed.js');

const FRIDAY_OFF = {
  weekday: 5,
  date: null,
  from_date: '2026-11-01',
  to_date: null,
  kind: 'off',
  label: 'Sexta',
};
const SUNDAY_OFF = {
  weekday: 0,
  date: null,
  from_date: '2026-11-01',
  to_date: null,
  kind: 'off',
  label: 'Domingo',
};

function occurrence(id, date, start, status = 'planned') {
  const [hours, minutes] = start.split(':').map(Number);
  const end = `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return {
    id,
    class_id: 'c1',
    content_id: 'content-1',
    date,
    start_at: `${date}T${start}:00`,
    end_at: `${date}T${end}:00`,
    status,
    platform_report_id: null,
  };
}

test('monthWeeks starts on the Monday of the week containing day 1', () => {
  const weeks = calendar.monthWeeks(2026, 10);
  assert.equal(weeks.length, 6);
  assert.equal(weeks[0].start, '2026-10-26');
  assert.equal(weeks[0].days.length, 7);
  const firstWeek = calendar.weekIndexForDate(weeks, '2026-11-01');
  assert.equal(firstWeek, 0);
  assert.equal(weeks[firstWeek].days[6], '2026-11-01');
});

test('isOffDay honours weekday, from_date and to_date', () => {
  assert.equal(calendar.isOffDay('2026-11-13', [FRIDAY_OFF]), true);
  assert.equal(calendar.isOffDay('2026-11-20', [FRIDAY_OFF]), true);
  assert.equal(calendar.isOffDay('2026-10-30', [FRIDAY_OFF]), false);
  assert.equal(calendar.isOffDay('2026-11-15', [SUNDAY_OFF]), true);
  assert.equal(calendar.isOffDay('2026-11-16', [FRIDAY_OFF, SUNDAY_OFF]), false);
});

test('findNext skips given, cancelled and past occurrences', () => {
  const rows = [
    occurrence('a', '2026-11-16', '09:00', 'given'),
    occurrence('b', '2026-11-16', '11:00', 'cancelled'),
    occurrence('c', '2026-11-16', '10:00'),
    occurrence('d', '2026-11-16', '12:00'),
  ];
  const next = dashboard.findNext(rows, new Date('2026-11-16T08:00:00'));
  assert.equal(next.id, 'c');
});

test('findOngoing accepts the grace window and ignores blocked statuses', () => {
  const rows = [
    occurrence('a', '2026-11-16', '10:00', 'holiday'),
    occurrence('b', '2026-11-16', '10:00'),
  ];
  assert.equal(dashboard.findOngoing(rows, new Date('2026-11-16T10:30:00')).id, 'b');
  assert.equal(dashboard.findOngoing(rows, new Date('2026-11-16T08:00:00')), null);
});

test('occurrencesForDate sorts by start time', () => {
  const rows = [
    occurrence('late', '2026-11-16', '15:00'),
    occurrence('early', '2026-11-16', '08:00'),
    occurrence('other', '2026-11-17', '09:00'),
  ];
  const today = dashboard.occurrencesForDate(rows, '2026-11-16');
  assert.deepEqual(
    today.map((row) => row.id),
    ['early', 'late']
  );
});

test('formatCountdown covers minutes, hours and days', () => {
  const now = new Date('2026-11-16T10:00:00');
  assert.equal(dashboard.formatCountdown(new Date('2026-11-16T09:59:00'), now), 'agora');
  assert.equal(dashboard.formatCountdown(new Date('2026-11-16T10:25:00'), now), 'em 25 min');
  assert.equal(dashboard.formatCountdown(new Date('2026-11-16T12:15:00'), now), 'em 2h 15min');
  assert.equal(dashboard.formatCountdown(new Date('2026-11-18T10:00:00'), now), 'em 2d 0h');
});

test('agenda treats official 2026 holidays as days off', () => {
  assert.equal(calendar.isOffDay('2026-11-20', []), true); // Consciência Negra
  assert.equal(calendar.isOffDay('2026-03-06', []), true); // Data Magna PE
  assert.equal(calendar.isOffDay('2026-05-18', []), true); // Aniversário de Caruaru
  assert.equal(calendar.isOffDay('2026-06-24', []), true); // São João
  assert.equal(calendar.isOffDay('2026-06-04', []), true); // Corpus Christi (Caruaru)
  assert.equal(calendar.isOffDay('2026-04-03', []), true); // Paixão de Cristo
  assert.equal(calendar.isOffDay('2026-06-29', []), false); // São Pedro saiu em 2024
  assert.equal(calendar.isOffDay('2026-11-16', []), false);
});

test('holidayFor exposes the official name, scope and source', () => {
  const national = holidays.holidayFor('2026-11-20');
  assert.equal(national.name, 'Dia Nacional de Zumbi e da Consciência Negra');
  assert.equal(national.scope, 'national');
  assert.match(national.source, /11\.460\/2025/);

  const municipal = holidays.holidayFor('2026-06-04');
  assert.equal(municipal.scope, 'municipal');
  assert.match(municipal.source, /7\.334\/2024/);

  assert.equal(holidays.holidayFor('2026-02-16').optional, true);
  assert.equal(holidays.holidayFor('2026-11-16'), undefined);
});

test('removed marker hides the occurrence and preserves its notes', () => {
  const original = JSON.stringify({ classReport: { text: 'relatório salvo' } });
  const marked = removed.markOccurrenceRemoved(original, 'prévia');
  const parsed = JSON.parse(marked);

  assert.equal(removed.isRemovedOccurrence(marked), true);
  assert.equal(removed.isRemovedOccurrence(original), false);
  assert.equal(removed.isRemovedOccurrence(null), false);
  assert.equal(parsed.classReport.text, 'relatório salvo');
  assert.equal(parsed.removed.reason, 'prévia');
  assert.equal(typeof parsed.removed.at, 'string');
});

test('class parity follows the 14-day class reports (week of 16/11)', () => {
  assert.equal(calendar.weekParity('2026-11-16'), 0);
  assert.equal(calendar.weekParity('2026-11-23'), 1);

  // Biweekly: week A (16/11) vs week B (23/11).
  for (const code of ['C1-01', 'C2-01', 'C2-03', 'C2-07']) {
    assert.equal(calendar.classOccursOn(code, '2026-11-16'), true, `${code} A`);
    assert.equal(calendar.classOccursOn(code, '2026-11-23'), false, `${code} B`);
  }
  for (const code of ['C1-02', 'C1-03', 'C2-02', 'C2-04', 'C2-05', 'C2-08']) {
    assert.equal(calendar.classOccursOn(code, '2026-11-16'), false, `${code} A`);
    assert.equal(calendar.classOccursOn(code, '2026-11-23'), true, `${code} B`);
  }

  // Weekly exceptions: PSE, Info Bilíngue and C2-06 (1:15).
  for (const code of ['C2-06', 'Info 09', 'Info 10', 'PSE C2-01', 'PSE C2-02', 'Teens 02']) {
    assert.equal(calendar.classOccursOn(code, '2026-11-16'), true, `${code} A`);
    assert.equal(calendar.classOccursOn(code, '2026-11-23'), true, `${code} B`);
  }
});
