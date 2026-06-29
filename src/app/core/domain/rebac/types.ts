export const objectTypes = {
  user: "user",
  team: "team",
  workspace: "workspace",
  document: "document",
} as const;

export type ObjectType = (typeof objectTypes)[keyof typeof objectTypes];

export type ObjectRef = `${ObjectType}:${string}`;
export type Relation = string;
export type Subject = ObjectRef | `${ObjectRef}#${Relation}`;

export type TupleKey = {
  object: ObjectRef;
  relation: Relation;
  user: Subject;
};

export type CheckRequest = {
  user: ObjectRef;
  relation: Relation;
  object: ObjectRef;
};

export type CheckResult = {
  allowed: boolean;
  trace: string[];
};

export type ParsedObject = {
  type: ObjectType;
  id: string;
};

export type ParsedSubjectSet = {
  object: ObjectRef;
  relation: Relation;
};
