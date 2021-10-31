import * as fc from "fast-check";
import IceMap from "./ice-map";

// Formula for calculating the maximum height of an AVL tree.
// ------------------------------------------------------------------------------------------------
// See https://en.wikipedia.org/wiki/AVL_tree for formula.
const phi = (1 + Math.sqrt(5)) / 2;
const logPhi = (x) => Math.log(x) / Math.log(phi);
const B = logPhi(5) / 2 - 2;
export const maxH = (n) => Math.trunc(logPhi(n + 2) + B);

const fst = (arr) => arr[0];

// Generators.
// ------------------------------------------------------------------------------------------------

const uniqPairs = () =>
  fc
    .set(fc.string(), { minLength: 1 })
    .chain((strs) =>
      fc.tuple(
        fc.constant(strs),
        fc.array(fc.anything(), {
          minLength: strs.length,
          maxLength: strs.length
        })
      )
    )
    .map(([keys, vals]) => keys.map((key, i) => [key, vals[i]]));

const pairs = () => fc.array(fc.tuple(fc.string(), fc.string()));

const alphabet = () =>
  fc.stringOf(fc.constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")));

// Tests
// ------------------------------------------------------------------------------------------------

test("IceMap should be a constructor", () => {
  fc.assert(
    fc.property(pairs(), (pairs) => {
      expect(new IceMap(pairs)).toBeInstanceOf(IceMap);
    })
  );
});

test("Set and get should return mirror values", () => {
  fc.assert(
    fc.property(pairs(), fc.string(), fc.anything(), (pairs, key, val) => {
      expect(new IceMap(pairs).set(key, val).get(key)).toBe(val);
    })
  );
});

test("Has should return true if the key is present", () => {
  fc.assert(
    fc.property(pairs(), fc.string(), fc.anything(), (pairs, key, val) => {
      expect(new IceMap(pairs).set(key, val).has(key)).toBe(true);
    })
  );
});

test("Has should return false if the key has been deleted", () => {
  fc.assert(
    fc.property(pairs(), fc.string(), fc.anything(), (pairs, key, val) => {
      const withoutKey = new IceMap(pairs).set(key, val).delete(key);
      expect(withoutKey.has(key)).toBe(false);
    })
  );
});

test("Delete should not remove any other keys", () => {
  fc.assert(
    fc.property(uniqPairs(), ([[key, val], ...pairs]) => {
      const iceMap = new IceMap(pairs).set(key, val).delete(key);
      expect(iceMap.has(key)).toBe(false);
      pairs.forEach(([presentKey]) => {
        expect(iceMap.has(presentKey)).toBe(
          true,
          `Expected ${presentKey} to be in map`
        );
      });
    })
  );
});

test("entries should return keys in sorted order", () => {
  fc.assert(
    fc.property(uniqPairs(), (pairs) => {
      const keysIn = pairs.map(fst).sort();
      const iceMap= new IceMap(pairs);
      const keysOut = [...iceMap.entries()].map(fst);
      expect(iceMap.entries().length).toEqual(pairs.length);
      expect(keysOut).toEqual(keysIn);
    })
  );
});

test("size property should always return the current size of the map", () => {
  fc.assert(
    fc.property(uniqPairs(), (pairs) => {
      const iceMap = new IceMap(pairs);
      expect(iceMap.size).toEqual(pairs.length);
    })
  );
});

test("height of tree should never be greater than maxH()", () => {
  fc.assert(
    fc.property(fc.array(fc.tuple(alphabet(), fc.string())), (pairs) => {
      const iceMap = new IceMap(pairs);
      const maxHeight = maxH(iceMap.size);
      if (Number.isNaN(maxHeight)) {
        console.group({maxHeight, iceMap})
      }
      expect(iceMap.isBalanced).toBe(true);
      if (iceMap.height > maxHeight) console.log(iceMap);
      expect(iceMap.height).toBeLessThanOrEqual(maxHeight);
    }),
    {
      examples: [
        [
          [
            ["B", ""],
            ["C", ""],
            ["E", ""],
            ["G", ""],
            ["F", ""],
            ["D", ""],
            ["A", ""]
          ]
        ],
        [
          [
            ["D", ""],
            ["A", ""],
            ["C", ""],
            ["F", ""],
            ["E", ""],
            ["B", ""]
          ]
        ]
      ],
      numRuns: 1000
    }
  );
});

test("There should never be any duplicate keys after concat()", () => {
  fc.assert(
    fc.property(uniqPairs(), uniqPairs(), (pairs1, pairs2) => {
      const map1 = new IceMap(pairs1);
      const map2 = new IceMap(pairs2);
      const expected = [
        ...new Set(pairs1.map(fst).concat(pairs2.map(fst))).values()
      ].sort();
      const merged = map1.concat(map2);
      const actual = merged.keys();
      expect(actual).toEqual(expected);
    }),
    {
      examples: [[[["A","1"]],[["A","1.1"],["B","B"],["C","C"]]]],
    }
  );
});

test("Height should never be greater than ceil(log2(n + 1)) after concat()", () => {
  fc.assert(
    fc.property(
      fc.array(fc.tuple(alphabet(), alphabet())),
      fc.array(fc.tuple(alphabet(), alphabet())),
      (pairs1, pairs2) => {
        const map1 = new IceMap(pairs1);
        const map2 = new IceMap(pairs2);
        const merged = map1.concat(map2);
        const maxHeight = maxH(merged.size);
        expect(merged.isBalanced).toBe(true);
        if (merged.height > maxHeight) {
          console.log(merged);
        }
        expect(merged.height).toBeLessThanOrEqual(maxHeight);
      }
    ),
    {
      examples: [
        [
          [
            ["A", ""],
            ["F", ""]
          ],
          [
            ["B", ""],
            ["D", ""],
            ["C", ""],
            ["G", ""],
            ["E", ""]
          ]
        ]
      ],
      numRuns: 1000
    }
  );
});

test("keys() should return keys in sorted order", () => {
  fc.assert(
    fc.property(uniqPairs(), (pairs) => {
      const keysIn = pairs.map(fst).sort();
      const iceMap= new IceMap(pairs);
      const keysOut = iceMap.keys();
      expect(iceMap.entries().length).toEqual(pairs.length);
      expect(keysOut).toEqual(keysIn);
    })
  );
});

test("foreach() should call each item in order", () => fc.assert(fc.property(uniqPairs(), (pairs) => {
    const iceMap = new IceMap(pairs);
    let actual = [];
    iceMap.forEach((v, k) => {
      actual.push(k);
    });
    const expected = pairs.map(fst).sort();
    expect(actual).toEqual(expected);
})));