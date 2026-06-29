import type {
    CheckRequest,
    CheckResult,
    ObjectRef,
    ObjectType,
    ParsedObject,
    ParsedSubjectSet,
    Relation,
    Subject,
    TupleKey,
} from "./types.ts";
import { objectTypes } from "./types.ts";

export const relation = {
    teamAdmin: "admin",
    teamMember: "member",
    workspaceOwner: "owner",
    workspaceEditor: "editor",
    workspaceViewer: "viewer",
    documentWorkspace: "workspace",
    documentOwner: "owner",
    documentEditor: "editor",
    documentViewer: "viewer",
    documentCanRead: "can_read",
    documentCanComment: "can_comment",
    documentCanEdit: "can_edit",
    documentCanDelete: "can_delete",
} as const satisfies Record<string, Relation>;

const knownObjectTypes = new Set<string>(Object.values(objectTypes));

const assertNonBlank = (value: string, label: string) => {
    if (value.trim() === "") {
        throw new Error(`rebac: ${label} cannot be empty`);
    }
};

const newObject = (type: ObjectType, id: string): ObjectRef => {
    assertNonBlank(id, `${type} id`);
    return `${type}:${id}`;
};

export const user = (id: string): ObjectRef => newObject(objectTypes.user, id);
export const team = (id: string): ObjectRef => newObject(objectTypes.team, id);
export const workspace = (id: string): ObjectRef =>
    newObject(objectTypes.workspace, id);
export const document = (id: string): ObjectRef =>
    newObject(objectTypes.document, id);

export const subjectSet = (object: ObjectRef, rel: Relation): Subject =>
    `${object}#${rel}`;

export const tuple = (
    object: ObjectRef,
    rel: Relation,
    subject: Subject,
): TupleKey => ({ object, relation: rel, user: subject });

export const parseObject = (value: string): ParsedObject => {
    const idx = value.indexOf(":");
    if (idx < 1 || idx === value.length - 1) {
        throw new Error(
            `invalid object ${JSON.stringify(value)}: want type:id`,
        );
    }

    const type = value.slice(0, idx);
    const id = value.slice(idx + 1);
    if (!knownObjectTypes.has(type)) {
        throw new Error(
            `unknown object type ${JSON.stringify(type)} in ${value}`,
        );
    }
    if (id.trim() === "") {
        throw new Error(
            `invalid object ${JSON.stringify(value)}: id cannot be blank`,
        );
    }

    return { type: type as ObjectType, id };
};

export const isSubjectSet = (subject: Subject): boolean =>
    subject.includes("#");

export const parseSubjectSet = (subject: Subject): ParsedSubjectSet => {
    const idx = subject.indexOf("#");
    if (idx < 1 || idx === subject.length - 1) {
        throw new Error(
            `invalid subject set ${JSON.stringify(subject)}: want object#relation`,
        );
    }

    const object = subject.slice(0, idx);
    parseObject(object);
    return { object: object as ObjectRef, relation: subject.slice(idx + 1) };
};

export type {
    CheckRequest,
    CheckResult,
    ObjectRef,
    ObjectType,
    ParsedObject,
    ParsedSubjectSet,
    Relation,
    Subject,
    TupleKey,
};
