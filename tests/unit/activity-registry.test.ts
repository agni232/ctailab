import { describe, expect, it } from "vitest";
import { getActivityImplementation, listRegisteredActivityTypes } from "@/activity-engine/registry";

describe("activity registry", () => {
  it("registers the cipher activity implementation", () => {
    expect(listRegisteredActivityTypes()).toContain("cipher");
    expect(getActivityImplementation("cipher")?.version).toBe(3);
  });

  it("returns undefined for unknown activity types", () => {
    expect(getActivityImplementation("missing-activity")).toBeUndefined();
  });
});
