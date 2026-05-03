/// <reference types="jest" />
import { extractNames, filterNames, generateOutput } from '../../../scripts/generate-lucide-types';

describe('generate-lucide-types parser (moved to src)', () => {
  test('extracts names from export block and aliases', () => {
    const content = `export { AArrowDown, CircleCheckBig as CheckCircle, FooIcon as Foo };`;
    const all = extractNames(content).sort();
    expect(all).toEqual(expect.arrayContaining(['AArrowDown', 'CheckCircle', 'Foo', 'FooIcon']));
  });

  test('fallback declared const parsing', () => {
    const content = `declare const XIcon: LucideIcon; declare const Y: typeof XIcon;`;
    const all = extractNames(content);
    expect(all).toEqual(expect.arrayContaining(['XIcon', 'Y']));
  });

  test('filters *Icon when base exists', () => {
    const names = ['Check', 'CheckIcon', 'ArrowRight', 'ArrowRightIcon'];
    const filtered = filterNames(names);
    expect(filtered).toContain('Check');
    expect(filtered).not.toContain('CheckIcon');
  });

  test('generateOutput produces declarations', () => {
    const out = generateOutput(['Foo', 'BarBaz']);
    expect(out).toMatch(/export declare const Foo:/);
    expect(out).toMatch(/export declare const BarBaz:/);
  });
});
import { extractNames, filterNames, generateOutput } from '../../../scripts/generate-lucide-types';

describe('generate-lucide-types parser (moved to src)', () => {
  test('extracts names from export block and aliases', () => {
    const content = `export { AArrowDown, CircleCheckBig as CheckCircle, FooIcon as Foo };`;
    const all = extractNames(content).sort();
    expect(all).toEqual(expect.arrayContaining(['AArrowDown', 'CheckCircle', 'Foo', 'FooIcon']));
  });

  test('fallback declared const parsing', () => {
    const content = `declare const XIcon: LucideIcon; declare const Y: typeof XIcon;`;
    const all = extractNames(content);
    expect(all).toEqual(expect.arrayContaining(['XIcon', 'Y']));
  });

  test('filters *Icon when base exists', () => {
    const names = ['Check', 'CheckIcon', 'ArrowRight', 'ArrowRightIcon'];
    const filtered = filterNames(names);
    expect(filtered).toContain('Check');
    expect(filtered).not.toContain('CheckIcon');
  });

  test('generateOutput produces declarations', () => {
    const out = generateOutput(['Foo', 'BarBaz']);
    expect(out).toMatch(/export declare const Foo:/);
    expect(out).toMatch(/export declare const BarBaz:/);
  });
});
