import { describe, expect, it } from "vitest";
import {
  document,
  parseObject,
  parseSubjectSet,
  relation,
  subjectSet,
  team,
  user,
  workspace,
} from "./index.ts";

describe("rebac object helpers", () => {
  it("builds fully-qualified object references", () => {
    expect(user("alice")).toBe("user:alice");
    expect(team("platformTeam")).toBe("team:platformTeam");
    expect(workspace("productWorkspace")).toBe("workspace:productWorkspace");
    expect(document("roadmapDocument")).toBe("document:roadmapDocument");
  });

  it("parses valid type:id objects", () => {
    expect(parseObject("workspace:productWorkspace")).toEqual({
      type: "workspace",
      id: "productWorkspace",
    });
  });

  it("rejects malformed objects", () => {
    expect(() => parseObject("roadmapDocument")).toThrow(/want type:id/);
    expect(() => parseObject("unknown:thing")).toThrow(/unknown object type/);
    expect(() => parseObject("user: ")).toThrow(/id cannot be blank/);
  });

  it("parses subject-set references", () => {
    expect(
      parseSubjectSet(subjectSet(team("platformTeam"), relation.teamMember)),
    ).toEqual({
      object: "team:platformTeam",
      relation: "member",
    });
  });
});
