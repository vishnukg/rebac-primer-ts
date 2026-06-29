import { describe, expect, it } from "vitest";
import { err, map, ok, unwrapOr } from "./result.ts";

describe("Result", () => {
  it("maps successful values and preserves errors", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual({ ok: true, value: 4 });

    const failure = err(new Error("nope"));
    expect(map(failure, (n: number) => n * 2)).toBe(failure);
  });

  it("unwraps with a fallback", () => {
    expect(unwrapOr(ok("yes"), "fallback")).toBe("yes");
    expect(unwrapOr(err("missing"), "fallback")).toBe("fallback");
  });
});
