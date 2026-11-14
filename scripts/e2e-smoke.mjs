#!/usr/bin/env node
/**
 * Dependency-free E2E smoke for the classroom flow.
 *
 * Requires:
 *   - a production build served (`npm run start -- -p 3000`);
 *   - Chrome/Chromium with remote debugging:
 *       chrome --headless=new --remote-debugging-port=9222 --user-data-dir=<tmp>
 *
 * Usage:
 *   E2E_BASE_URL=http://localhost:3000 E2E_CDP_URL=http://127.0.0.1:9222 \
 *     node scripts/e2e-smoke.mjs
 */

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const CDP_URL = process.env.E2E_CDP_URL ?? 'http://127.0.0.1:9222';

const results = [];

function log(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` â€” ${detail}` : ''}`);
}

async function newTab(url) {
  const target = await (
    await fetch(`${CDP_URL}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })
  ).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const next = ++id;
      pending.set(next, resolve);
      ws.send(JSON.stringify({ id: next, method, params }));
    });
  const evaluate = async (expression) => {
    const response = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return response.result?.result?.value;
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await new Promise((resolve) => (ws.onopen = resolve));
  await send('Page.enable');
  await send('Page.navigate', { url });
  return {
    send,
    wait,
    evaluate,
    async text() {
      return evaluate('document.body.innerText');
    },
    async close() {
      ws.close();
    },
  };
}

async function waitFor(tab, expression, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await tab.evaluate(expression)) return true;
    await tab.wait(250);
  }
  return false;
}

async function clickText(tab, pattern) {
  return tab.evaluate(`(() => {
    const button = Array.from(document.querySelectorAll('button'))
      .find((el) => ${pattern}.test(el.innerText));
    if (!button) return 'none';
    button.click();
    return 'ok';
  })()`);
}

async function run() {
  const existing = await (await fetch(`${CDP_URL}/json/list`)).json();
  for (const target of existing) {
    if (target.type === 'page' && !target.url.startsWith('about:')) {
      try {
        await fetch(`${CDP_URL}/json/close/${target.id}`);
      } catch {
        // Best effort: a tab may already be closing.
      }
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 800));

  for (const [route, destination] of [
    ['/aula', '/professor'],
    ['/tv', '/tela'],
  ]) {
    const response = await fetch(`${BASE_URL}${route}`, { redirect: 'manual' });
    const location = response.headers.get('location') ?? '';
    log(`${route} redirect`, response.status === 308 && location.endsWith(destination), `${response.status} ${location}`);
  }

  const professor = await newTab(`${BASE_URL}/professor`);
  await professor.wait(1500);
  await professor.evaluate('localStorage.clear()');
  await professor.send('Page.reload');
  await professor.wait(2500);
  log('gate renders', await waitFor(professor, "/rea do professor|c.digo de acesso/i.test(document.body.innerText)", 18000));

  const gateCode = process.env.E2E_GATE_CODE;
  if (gateCode) {
    await professor.evaluate("document.querySelector('#aula-gate')?.focus()");
    await professor.send('Input.insertText', { text: gateCode });
    await professor.wait(250);
    await clickText(professor, '/^entrar$/i');
  } else {
    await professor.evaluate("localStorage.setItem('supp-aula-gate','1')");
    await professor.send('Page.reload');
  }
  await professor.wait(3000);
  log(
    'cockpit after gate',
    await waitFor(professor, "/aula vai comeÃ§ar|PRÃ“XIMA AULA|AGENDA/i.test(document.body.innerText)")
  );

  log(
    'cursor visible by default',
    await professor.evaluate(
      "getComputedStyle(document.body).cursor !== 'none' && !document.documentElement.classList.contains('hide-cursor')"
    )
  );
  await professor.send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
  });
  log(
    'agenda rendered at 1366x768',
    await professor.evaluate("/Agenda/i.test(document.body.innerText)")
  );

  const greeting = await professor.evaluate(
    "document.querySelector('h1, h2')?.innerText?.trim() ?? ''"
  );
  log('greeting has text', greeting.length > 0, greeting.slice(0, 40));

  const lessonFound = await professor.evaluate(`(() => {
    document.querySelectorAll('details').forEach((details) => { details.open = true; });
    const button =
      document.querySelector('details[open] article button') ??
      Array.from(document.querySelectorAll('article button')).find((el) =>
        /abrir|iniciar aula/i.test(el.innerText)
      );
    if (!button) return false;
    button.click();
    return true;
  })()`);
  await professor.wait(2500);
  const bodyAfterLesson = await professor.text();
  const code = bodyAfterLesson.match(/C.{0,4}DIGO DA SESS.{0,8}\s+([A-Z0-9]{5})/i)?.[1];
  log('lesson opens', lessonFound && Boolean(code));

  log('session code visible', Boolean(code), code ?? '');

  const tv = await newTab(`${BASE_URL}/tela?c=${code}`);
  await tv.wait(4000);
  log('TV connects', (await tv.text()).includes(code));
  await tv.send('Page.reload');
  await tv.wait(5000);
  log('TV keeps code after F5', (await tv.text()).includes(code));

  await professor.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await tv.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await tv.send('Page.reload');
  await tv.wait(4000);
  log('TV at 1920x1080', (await tv.text()).includes(code));

  await professor.wait(800);
  const d20Click = await clickText(professor, '/D20/i');
  if (d20Click !== 'ok') {
    console.log(
      'D20 buttons:',
      await professor.evaluate(
        "Array.from(document.querySelectorAll('button')).map((el) => el.innerText.trim()).filter(Boolean).slice(0, 20)"
      )
    );
  }
  log(
    'D20 modal',
    d20Click === 'ok' &&
      (await waitFor(professor, "/Iniciar D20/i.test(document.body.innerText)"))
  );
  await clickText(professor, '/iniciar d20/i');
  await professor.wait(1500);
  log('D20 board on TV', /Escolha um n.m/i.test(await tv.text()));
  await professor.evaluate(`(() => {
    const panel = document.querySelector('[aria-label="D20 na TV"]');
    const one = Array.from(panel?.querySelectorAll('button') ?? [])
      .find((el) => el.innerText.trim() === '1');
    one?.click();
  })()`);
  await tv.wait(1200);
  log('D20 question on TV', (await tv.text()).includes('VERDADEIRO'));
  await clickText(professor, '/^acertou$/i');
  await tv.wait(800);
  log('D20 reveal on TV', (await tv.text()).includes('Acertou!'));
  await clickText(professor, '/^encerrar$/i');
  await tv.wait(1500);
  log('D20 exit', !(await tv.text()).includes('Escolha um nÃºmero'));

  await tv.close();
  await professor.close();
}

run()
  .catch((error) => {
    console.error('E2E crashed:', error);
    results.push({ name: 'E2E crash', ok: false, detail: String(error) });
  })
  .finally(() => {
    const failed = results.filter((result) => !result.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    process.exit(failed.length === 0 ? 0 : 1);
  });

