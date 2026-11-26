import { describe, expect, it, vi } from "vitest";
import { assertAdmin } from "./admin-auth";

function roleClient(data: boolean | null, error: unknown = null) {
  return { rpc: vi.fn(async () => ({ data, error })) };
}

describe("administrator access", () => {
  it("allows an account with the admin role", async () => {
    const client = roleClient(true);
    await expect(assertAdmin(client, "admin-user")).resolves.toBeUndefined();
    expect(client.rpc).toHaveBeenCalledWith("has_role", { _user_id: "admin-user", _role: "admin" });
  });

  it("rejects a signed-in account without the admin role", async () => {
    await expect(assertAdmin(roleClient(false), "ordinary-user")).rejects.toThrow("Forbidden");
  });

  it("rejects the request when the role cannot be verified", async () => {
    await expect(assertAdmin(roleClient(null, new Error("unavailable")), "ordinary-user")).rejects.toThrow(
      "Forbidden",
    );
  });
});
