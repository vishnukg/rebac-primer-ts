export type TupleValidationError = Error & {
    readonly kind: "tuple_validation";
};

export const tupleValidationError = (message: string): TupleValidationError =>
    Object.assign(new Error(`tuple validation: ${message}`), {
        name: "TupleValidationError",
        kind: "tuple_validation" as const,
    });

export const isTupleValidationError = (
    caught: unknown,
): caught is TupleValidationError =>
    caught instanceof Error &&
    "kind" in caught &&
    caught.kind === "tuple_validation";
