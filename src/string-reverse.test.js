import * as fc from "fast-check";

import reverse from "./string-reverse";

test("Output string should be the same length as the input string", () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      expect(reverse(str).length).toBe(str.length);
    })
  );
});

test("output string should contain the same set of characters as the input string", () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      const reversed = reverse(str);
      const chars = str.split("");
      reversed.split("").forEach((c) => {
        expect(chars).toContain(c);
      });
    })
  );
});

function genPalindrome(cs) {
  return cs.reduce((str, c) => c + str + c, "");
}

test("If we reverse a palindrome, we should get back the same string we pass in", () => {
  fc.assert(
    fc.property(fc.array(fc.unicode()).map(genPalindrome), (str) => {
      expect(reverse(str)).toBe(str);
    })
  );
});

test("Reversing a string twice should give us back the original string", () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      expect(reverse(reverse(str))).toBe(str);
    })
  );
});

function uniqueStr(str) {
  const uniqChars = str.split("").reduce((s, c) => s.add(c), new Set());
  return [...uniqChars.values()].join("");
}

const nonPalindrome = fc
  .string()
  .map(uniqueStr)
  .filter((s) => s.length > 1);

test("Reversing a non-symmetric string should NOT return the same string", () =>
  fc.assert(
    fc.property(nonPalindrome, (str) => expect(reverse(str)).not.toEqual(str)),
    { seed: "<seed-goes-here>" }
  ));
