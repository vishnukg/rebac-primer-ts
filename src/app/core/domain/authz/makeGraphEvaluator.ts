import type {
    Evaluator,
    OperationContext,
    TupleReader,
} from "../../ports/index.ts";
import {
    isSubjectSet,
    objectTypes,
    parseObject,
    parseSubjectSet,
    relation,
} from "../rebac/index.ts";
import type {
    CheckRequest,
    CheckResult,
    ObjectRef,
    Relation,
    Subject,
} from "../rebac/index.ts";
import { documentRules, teamRules, workspaceRules } from "./model.ts";
import type { ImpliedBy } from "./model.ts";
import { validateCheckRequest } from "./validate.ts";

const defaultMaxDepth = 100;

type MakeGraphEvaluatorCfg = {
    store: TupleReader;
    maxDepth?: number;
};

type Resolution = {
    ctx: OperationContext;
    trace: string[];
    visiting: Set<string>;
};

const abortError = (signal: AbortSignal): Error => {
    if (signal.reason instanceof Error) {
        return signal.reason;
    }

    const err = new Error("operation aborted");
    err.name = "AbortError";
    return err;
};

const throwIfAborted = (ctx: OperationContext) => {
    if (ctx.signal?.aborted) {
        throw abortError(ctx.signal);
    }
};

const visitKey = (object: ObjectRef, rel: Relation) => `${object}#${rel}`;

export const makeGraphEvaluator = ({
    store,
    maxDepth = defaultMaxDepth,
}: MakeGraphEvaluatorCfg): Evaluator => {
    const hasRelation = async (
        resolution: Resolution,
        user: ObjectRef,
        object: ObjectRef,
        rel: Relation,
        depth: number,
    ): Promise<boolean> => {
        throwIfAborted(resolution.ctx);

        if (depth > maxDepth) {
            throw new Error(
                `graph: max resolution depth ${maxDepth} exceeded at ${object}#${rel}`,
            );
        }

        const key = visitKey(object, rel);
        if (resolution.visiting.has(key)) {
            resolution.trace.push(
                `Cycle detected at ${object}#${rel}; stop this branch`,
            );
            return false;
        }

        resolution.visiting.add(key);
        try {
            const found = await hasTuple(resolution, user, object, rel, depth);
            if (found) {
                return true;
            }

            let objectType: string;
            try {
                objectType = parseObject(object).type;
            } catch {
                return false;
            }

            if (objectType === objectTypes.team) {
                return expandByRules(
                    resolution,
                    teamRules,
                    user,
                    object,
                    rel,
                    depth,
                );
            }

            if (objectType === objectTypes.workspace) {
                return expandByRules(
                    resolution,
                    workspaceRules,
                    user,
                    object,
                    rel,
                    depth,
                );
            }

            if (objectType === objectTypes.document) {
                return expandDocument(resolution, user, object, rel, depth);
            }

            return false;
        } finally {
            resolution.visiting.delete(key);
        }
    };

    const hasTuple = async (
        resolution: Resolution,
        user: ObjectRef,
        object: ObjectRef,
        rel: Relation,
        depth: number,
    ): Promise<boolean> => {
        let direct: boolean;
        try {
            direct = await store.has(resolution.ctx, object, rel, user);
        } catch (caught) {
            throw new Error(`store.has(${object}, ${rel}, ${user})`, {
                cause: caught,
            });
        }

        if (direct) {
            resolution.trace.push(
                `Found direct tuple (${object}, ${rel}, ${user})`,
            );
            return true;
        }

        let candidates;
        try {
            candidates = await store.findByObjectRelation(
                resolution.ctx,
                object,
                rel,
            );
        } catch (caught) {
            throw new Error(`store.findByObjectRelation(${object}, ${rel})`, {
                cause: caught,
            });
        }

        for (const candidate of candidates) {
            if (!isSubjectSet(candidate.user)) {
                continue;
            }

            const contains = await subjectSetContains(
                resolution,
                user,
                candidate.user,
                depth,
            );
            if (contains) {
                resolution.trace.push(
                    `Found subject-set tuple (${object}, ${rel}, ${candidate.user})`,
                );
                return true;
            }
        }

        return false;
    };

    const subjectSetContains = async (
        resolution: Resolution,
        user: ObjectRef,
        subject: Subject,
        depth: number,
    ): Promise<boolean> => {
        let parsed;
        try {
            parsed = parseSubjectSet(subject);
        } catch {
            return false;
        }

        resolution.trace.push(
            `Resolve subject set ${subject}: does it contain ${user}?`,
        );
        return hasRelation(
            resolution,
            user,
            parsed.object,
            parsed.relation,
            depth + 1,
        );
    };

    const expandByRules = async (
        resolution: Resolution,
        rules: ImpliedBy,
        user: ObjectRef,
        object: ObjectRef,
        rel: Relation,
        depth: number,
    ): Promise<boolean> => {
        for (const implied of rules[rel] ?? []) {
            resolution.trace.push(`${object} ${rel} includes ${implied}`);
            if (
                await hasRelation(resolution, user, object, implied, depth + 1)
            ) {
                return true;
            }
        }

        return false;
    };

    const expandDocument = async (
        resolution: Resolution,
        user: ObjectRef,
        object: ObjectRef,
        rel: Relation,
        depth: number,
    ): Promise<boolean> => {
        if (
            await expandByRules(
                resolution,
                documentRules,
                user,
                object,
                rel,
                depth,
            )
        ) {
            return true;
        }

        if (
            rel !== relation.documentOwner &&
            rel !== relation.documentEditor &&
            rel !== relation.documentViewer
        ) {
            return false;
        }

        let parents;
        try {
            parents = await store.findByObjectRelation(
                resolution.ctx,
                object,
                relation.documentWorkspace,
            );
        } catch (caught) {
            throw new Error(
                `store.findByObjectRelation(${object}, ${relation.documentWorkspace})`,
                { cause: caught },
            );
        }

        for (const parent of parents) {
            resolution.trace.push(
                `${object} ${rel} can inherit ${rel} from ${parent.user}`,
            );

            const workspaceObject = parent.user as ObjectRef;
            try {
                if (
                    parseObject(workspaceObject).type !== objectTypes.workspace
                ) {
                    continue;
                }
            } catch {
                continue;
            }

            if (
                await hasRelation(
                    resolution,
                    user,
                    workspaceObject,
                    rel,
                    depth + 1,
                )
            ) {
                return true;
            }
        }

        return false;
    };

    const evaluate = async (
        ctx: OperationContext,
        request: CheckRequest,
    ): Promise<CheckResult> => {
        validateCheckRequest(request);

        const resolution: Resolution = {
            ctx,
            trace: [
                `Check whether ${request.user} has ${request.relation} on ${request.object}`,
            ],
            visiting: new Set<string>(),
        };

        const allowed = await hasRelation(
            resolution,
            request.user,
            request.object,
            request.relation,
            0,
        );

        resolution.trace.push(allowed ? "Result: allowed" : "Result: denied");
        return { allowed, trace: resolution.trace };
    };

    return { evaluate };
};
