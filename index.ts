import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/** Tools whose string arguments are prose the person or another agent reads. */
export const PROSE_TOOLS: ReadonlySet<string> = new Set([
  'answer',
  'team_message', 'team_send',
  'agent_reply',
  'subagent_report', 'subagent_ask', 'subagent_send',
  'self_compact',
  'memory_record',
  'proto_reply',
  'pi_qa_tester_report', 'pi_qa_reviewer_report',
]);

/** A run of \uXXXX escapes not itself escaped (`\\u00f3` is a literal backslash and stays). */
const RUN = /(?<!\\)(?:\\u[0-9a-fA-F]{4})+/g;

/** "c\u00f3digo" → "código". ASCII escapes and lone surrogates keep their written form. */
export function unescapeText(text: string): string {
  if (!text.includes('\\u')) return text;
  return text.replace(RUN, run => {
    const escapes = run.match(/\\u[0-9a-fA-F]{4}/g)!;
    const units = escapes.map(escape => Number.parseInt(escape.slice(2), 16));
    const out: string[] = [];
    const consumed = new Set<number>();
    for (const [i, unit] of units.entries()) {
      if (consumed.has(i)) continue;
      const next = units[i + 1];
      if (unit >= 0xd800 && unit <= 0xdbff && next !== undefined && next >= 0xdc00 && next <= 0xdfff) {
        out.push(String.fromCharCode(unit, next));
        consumed.add(i + 1);
      } else if (unit < 0x80 || (unit >= 0xd800 && unit <= 0xdfff)) {
        out.push(escapes[i]!);
      } else {
        out.push(String.fromCharCode(unit));
      }
    }
    return out.join("");
  });
}

/** The value with every string decoded; the same object when nothing changed. */
export function unescapeValue<T>(value: T): T {
  if (typeof value === 'string') return unescapeText(value) as T;
  if (Array.isArray(value)) {
    const items = value.map(unescapeValue);
    return (items.some((item, index) => item !== value[index]) ? items : value) as T;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => [key, item, unescapeValue(item)] as const);
    if (entries.every(([, item, fixed]) => fixed === item)) return value as T;
    return Object.fromEntries(entries.map(([key, , fixed]) => [key, fixed])) as T;
  }
  return value;
}

/** Automatic decoding is retired: literal escapes can be technical evidence. */
export default function piUnescape(_pi: ExtensionAPI): void {
  // Keep the package loadable for existing installations, without rewriting
  // tool arguments or signed conversation messages. Helpers are explicit only.
}
