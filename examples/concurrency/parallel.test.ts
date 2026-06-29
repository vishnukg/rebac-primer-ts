import { describe, expect, it } from "vitest";
import { runBoundedParallel, runParallel } from "./parallel.ts";

const valueTask = (value: number) => async () => value;

describe("parallel helpers", () => {
    it("runs all tasks and preserves result order", async () => {
        await expect(
            runParallel([valueTask(1), valueTask(2), valueTask(3)]),
        ).resolves.toEqual([1, 2, 3]);
    });

    it("supports a bounded worker count", async () => {
        await expect(
            runBoundedParallel([valueTask(1), valueTask(2), valueTask(3)], 2),
        ).resolves.toEqual([1, 2, 3]);
    });
});
