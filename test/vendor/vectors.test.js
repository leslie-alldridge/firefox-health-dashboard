/* eslint-disable linebreak-style */
/* global describe, it */
import { vector, leaves, toPairs } from '../../src/vendor/vectors';

const data = [
  { a: 1 },
  { a: { b: 0, c: 1 }, d: 3 },
  { a: null, e: 3 },
  { d: 3 },
  null,
];

describe('vectors', () => {
  it('select Array', () => {
    expect(
      vector(data)
        .select(['a', 'd'])
        .toArray()
    ).toEqual([
      { a: 1, d: null },
      { a: { b: 0, c: 1 }, d: 3 },
      { a: null, d: null },
      { a: null, d: 3 },
      { a: null, d: null },
    ]);
  });

  it('select rename', () => {
    expect(
      vector(data)
        .select({ x: 'a', y: 'd' })
        .toArray()
    ).toEqual([
      { x: 1, y: null },
      { x: { b: 0, c: 1 }, y: 3 },
      { x: null, y: null },
      { x: null, y: 3 },
      { x: null, y: null },
    ]);
  });

  it('select value', () => {
    expect(
      vector(data)
        .select('a')
        .toArray()
    ).toEqual([1, { b: 0, c: 1 }, null, null, null]);
  });

  it('enumerate', () => {
    expect(
      vector(data)
        .enumerate()
        .map((v, i) => i)
        .toArray()
    ).toEqual([0, 1, 2, 3, 4]);
  });

  it('limit', () => {
    expect(
      vector(data)
        .limit(2)
        .toArray()
    ).toEqual([{ a: 1 }, { a: { b: 0, c: 1 }, d: 3 }]);
  });

  it('where', () => {
    expect(
      vector(data)
        .where({ d: 3 })
        .toArray()
    ).toEqual([{ a: { b: 0, c: 1 }, d: 3 }, { d: 3 }]);
  });

  it('missing', () => {
    expect(
      vector(data)
        .missing('d')
        .toArray()
    ).toEqual([{ a: 1 }, { a: null, e: 3 }, null]);
  });

  it('groupBy 2', () => {
    expect(
      vector(data)
        .groupBy(['d', 'e'])
        .map((v, g) => [v, g])
        .toArray()
    ).toEqual([
      [[{ a: 1 }, null], { d: null, e: null }],
      [[{ a: { b: 0, c: 1 }, d: 3 }, { d: 3 }], { d: 3, e: null }],
      [[{ a: null, e: 3 }], { d: null, e: 3 }],
    ]);
  });

  it('index ok', () => {
    expect(
      vector(data)
        .exists('a')
        .index('d')
    ).toEqual({
      '3': { a: { b: 0, c: 1 }, d: 3 },
      null: { a: 1 },
    });
  });

  it('index error', () => {
    expect(() => vector(data).index('d')).toThrow();
  });

  it('leaves', () => {
    expect(leaves({ a: { b: 0, c: 1 }, d: 3 }).fromPairs()).toEqual({
      'a.b': 0,
      'a.c': 1,
      d: 3,
    });
  });

  it('toPairs', () => {
    expect(toPairs({}).length).toEqual(0);
    expect(toPairs({}).exists().length).toEqual(0);
  });
});
