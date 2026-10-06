import assert from 'node:assert/strict';
import { test } from 'node:test';
import piUnescape, { PROSE_TOOLS, unescapeText, unescapeValue } from '../index.ts';

/** Escapes are built from parts so no editor or tool decodes them in this file. */
const BS = '\\';
const esc = (hex: string): string => `${BS}u${hex}`;
const ESCAPED = `c${esc('00f3')}digo`;
const DECODED = 'c\u{f3}digo';

test('non-ASCII escapes become the characters they name', () => {
  assert.equal(unescapeText(ESCAPED), DECODED);
  assert.equal(unescapeText(`secci${esc('00f3')}n ${esc('2014')} acci${esc('00F3')}n`), 'secci\u{f3}n \u{2014} acci\u{f3}n');
  assert.equal(unescapeText(`ok ${esc('d83d')}${esc('de00')}`), 'ok \u{1f600}', 'a surrogate pair is one emoji');
});

test('what is code stays as written', () => {
  assert.equal(unescapeText(`quote ${esc('0022')} tag ${esc('003C')}`), `quote ${esc('0022')} tag ${esc('003C')}`, 'ASCII escapes');
  assert.equal(unescapeText(`${BS}${esc('00f3')}`), `${BS}${esc('00f3')}`, 'an escaped backslash is a literal backslash');
  assert.equal(unescapeText(`lone ${esc('d83d')} half`), `lone ${esc('d83d')} half`, 'a lone surrogate');
  assert.equal(unescapeText('no escapes here'), 'no escapes here');
});

test('nested arguments are decoded; an untouched value keeps its identity', () => {
  const args = { kind: 'change', files: [{ path: 'a.ts', change: ESCAPED }], pending: [ESCAPED, 'plain'] };
  const fixed = unescapeValue(args);
  assert.notEqual(fixed, args);
  assert.deepEqual(fixed, { kind: 'change', files: [{ path: 'a.ts', change: DECODED }], pending: [DECODED, 'plain'] });
  assert.equal(args.pending[0], ESCAPED, 'the original is not mutated');
  const clean = { kind: 'answer', answer: 'listo', refs: [] };
  assert.equal(unescapeValue(clean), clean);
});

function load() {
  const handlers = new Map<string, (event: any) => any>();
  const calls: string[] = [];
  piUnescape(new Proxy({}, {
    get: (_target, prop: string) => (...args: any[]) => {
      calls.push(prop);
      if (prop === 'on') handlers.set(args[0], args[1]);
    },
  }) as any);
  return { handlers, calls };
}

test('installation never rewrites tool arguments or conversation history', () => {
  const { handlers, calls } = load();
  assert.deepEqual(calls, []);
  assert.equal(handlers.size, 0, 'literal escapes in paths, commands and evidence must reach the model unchanged');
});
