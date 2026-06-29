import {
    isSubjectSet,
    objectTypes,
    parseObject,
    parseSubjectSet,
    relation,
} from "../rebac/index.ts";
import type {
    CheckRequest,
    ObjectType,
    Relation,
    Subject,
    TupleKey,
} from "../rebac/index.ts";
import { tupleValidationError } from "./errors.ts";

const documentRelations: readonly Relation[] = [
    relation.documentWorkspace,
    relation.documentOwner,
    relation.documentEditor,
    relation.documentViewer,
    relation.documentCanRead,
    relation.documentCanComment,
    relation.documentCanEdit,
    relation.documentCanDelete,
];

const computedDocumentRelations: readonly Relation[] = [
    relation.documentCanRead,
    relation.documentCanComment,
    relation.documentCanEdit,
    relation.documentCanDelete,
];

const validateSubject = (
    subject: Subject,
): { type: ObjectType; relation: Relation | "" } => {
    if (isSubjectSet(subject)) {
        const parsedSubjectSet = parseSubjectSet(subject);
        const parsedObject = parseObject(parsedSubjectSet.object);
        return { type: parsedObject.type, relation: parsedSubjectSet.relation };
    }

    const parsedObject = parseObject(subject);
    return { type: parsedObject.type, relation: "" };
};

export const relationDefinedFor = (
    objectType: ObjectType,
    rel: Relation,
): boolean => {
    if (objectType === objectTypes.team) {
        return rel === relation.teamAdmin || rel === relation.teamMember;
    }

    if (objectType === objectTypes.workspace) {
        return (
            rel === relation.workspaceOwner ||
            rel === relation.workspaceEditor ||
            rel === relation.workspaceViewer
        );
    }

    if (objectType === objectTypes.document) {
        return documentRelations.includes(rel);
    }

    return false;
};

const isComputedRelation = (objectType: ObjectType, rel: Relation): boolean =>
    objectType === objectTypes.document &&
    computedDocumentRelations.includes(rel);

const relationCheckableForUser = (
    objectType: ObjectType,
    rel: Relation,
): boolean =>
    !(
        objectType === objectTypes.document &&
        rel === relation.documentWorkspace
    );

const subjectAllowed = (
    objectType: ObjectType,
    rel: Relation,
    subjectType: ObjectType,
    subjectRelation: Relation | "",
): boolean => {
    if (subjectRelation === "") {
        if (
            objectType === objectTypes.document &&
            rel === relation.documentWorkspace
        ) {
            return subjectType === objectTypes.workspace;
        }

        return subjectType === objectTypes.user;
    }

    if (subjectType !== objectTypes.team) {
        return false;
    }

    if (
        objectType === objectTypes.workspace &&
        rel === relation.workspaceOwner
    ) {
        return subjectRelation === relation.teamAdmin;
    }

    if (
        objectType === objectTypes.workspace &&
        (rel === relation.workspaceEditor || rel === relation.workspaceViewer)
    ) {
        return subjectRelation === relation.teamMember;
    }

    return false;
};

export const validateTuple = (tuple: TupleKey): void => {
    let objectType: ObjectType;
    try {
        objectType = parseObject(tuple.object).type;
    } catch (caught) {
        throw tupleValidationError(
            `object ${JSON.stringify(tuple.object)} is not a valid type:id (${caught instanceof Error ? caught.message : String(caught)})`,
        );
    }

    if (tuple.relation === "") {
        throw tupleValidationError("relation cannot be empty");
    }

    if (!relationDefinedFor(objectType, tuple.relation)) {
        throw tupleValidationError(
            `relation ${JSON.stringify(tuple.relation)} is not defined for ${objectType} objects`,
        );
    }

    if (isComputedRelation(objectType, tuple.relation)) {
        throw tupleValidationError(
            `relation ${JSON.stringify(tuple.relation)} is computed and cannot be written`,
        );
    }

    let subject: { type: ObjectType; relation: Relation | "" };
    try {
        subject = validateSubject(tuple.user);
    } catch (caught) {
        throw tupleValidationError(
            `user ${JSON.stringify(tuple.user)} is not a valid object or subject set (${caught instanceof Error ? caught.message : String(caught)})`,
        );
    }

    if (
        !subjectAllowed(
            objectType,
            tuple.relation,
            subject.type,
            subject.relation,
        )
    ) {
        throw tupleValidationError(
            `user ${JSON.stringify(tuple.user)} is not allowed for ${objectType}#${tuple.relation}`,
        );
    }
};

export const validateCheckRequest = (request: CheckRequest): void => {
    let userType: ObjectType;
    try {
        userType = parseObject(request.user).type;
    } catch {
        throw tupleValidationError(
            `check user ${JSON.stringify(request.user)} must be a valid user object`,
        );
    }

    if (userType !== objectTypes.user) {
        throw tupleValidationError(
            `check user ${JSON.stringify(request.user)} must be a valid user object`,
        );
    }

    let objectType: ObjectType;
    try {
        objectType = parseObject(request.object).type;
    } catch (caught) {
        throw tupleValidationError(
            `check object ${JSON.stringify(request.object)} is invalid (${caught instanceof Error ? caught.message : String(caught)})`,
        );
    }

    if (!relationDefinedFor(objectType, request.relation)) {
        throw tupleValidationError(
            `relation ${JSON.stringify(request.relation)} is not defined for ${objectType} objects`,
        );
    }

    if (!relationCheckableForUser(objectType, request.relation)) {
        throw tupleValidationError(
            `relation ${JSON.stringify(request.relation)} on ${objectType} objects cannot be checked for a user`,
        );
    }
};
