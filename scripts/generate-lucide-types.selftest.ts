import assert from 'assert';

import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const modPath = path.join(__dirname, 'generate-lucide-types.ts');
    const mod = await import(pathToFileURL(modPath).href);
    const {
      extractNames,
      filterNames,
      generateOutput
    } = mod as {
      extractNames: (content: string) => string[];
      filterNames: (names: string[]) => string[];
      generateOutput: (names: string[]) => string;
    };

    // export block + aliases
    let content = `export { AArrowDown, CircleCheckBig as CheckCircle, FooIcon as Foo };`;
    let all = extractNames(content).sort();
    assert.ok(all.includes('AArrowDown'));
    assert.ok(all.includes('CheckCircle'));
    assert.ok(all.includes('Foo'));

    // fallback declared const
    content = `declare const XIcon: LucideIcon; declare const Y: typeof XIcon;`;
    all = extractNames(content);
    assert.ok(all.includes('XIcon'));
    assert.ok(all.includes('Y'));

    // filter logic
    const filtered = filterNames(['Check', 'CheckIcon', 'ArrowRight', 'ArrowRightIcon']);
    assert.ok(filtered.includes('Check'));
    assert.ok(!filtered.includes('CheckIcon'));

    // output generation
    const out = generateOutput(['Foo', 'BarBaz']);
    assert.match(out, /export declare const Foo:/);
    assert.match(out, /export declare const BarBaz:/);

    // eslint-disable-next-line no-console
    console.log('Self-test passed');
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error('Self-test failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  }
})();
