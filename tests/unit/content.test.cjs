const test = require('node:test');
const assert = require('node:assert/strict');

const resolve = require('../../.test-build/content/resolve.js');
const validate = require('../../.test-build/content/validate.js');

const block = (id) => ({
  id,
  label: id,
  minutes: 10,
  talk: [],
  do: [],
  slides: [{ kind: 'big', lines: [id] }],
});

test('snapshot wins over every override', () => {
  const segments = resolve.resolveSegments({
    snapshot: [block('snapshot')],
    content: [block('content')],
    classOverride: { segments: [block('class')] },
    occurrenceOverride: { segments: [block('occurrence')] },
  });
  assert.deepEqual(
    segments.map((item) => item.id),
    ['snapshot']
  );
});

test('occurrence override wins over class override and content', () => {
  const segments = resolve.resolveSegments({
    snapshot: null,
    content: [block('content')],
    classOverride: { segments: [block('class')] },
    occurrenceOverride: { segments: [block('occurrence')] },
  });
  assert.equal(segments[0].id, 'occurrence');
});

test('class override wins over canonical content', () => {
  const segments = resolve.resolveSegments({
    snapshot: null,
    content: [block('content')],
    classOverride: { segments: [block('class')] },
  });
  assert.equal(segments[0].id, 'class');
});

test('falls back to canonical content and metadata', () => {
  const content = [block('content')];
  assert.equal(resolve.resolveSegments({ snapshot: null, content })[0].id, 'content');
  assert.equal(resolve.resolveTitle('Canônica'), 'Canônica');
  assert.equal(resolve.resolveTotalMin(150), 150);
  assert.equal(
    resolve.resolveTitle('Canônica', { title: 'Turma' }, { title: 'Classe' }),
    'Turma'
  );
});

test('validateSegments rejects malformed and oversized payloads', () => {
  assert.equal(validate.validateSegments([]).ok, false);
  assert.equal(validate.validateSegments([{ label: 'sem id' }]).ok, false);
  assert.equal(validate.validateSegments([{ id: 'ok' }]).ok, true);
  assert.equal(
    validate.validateSegments([{ id: 'x', huge: 'a'.repeat(250_000) }]).ok,
    false
  );
});
