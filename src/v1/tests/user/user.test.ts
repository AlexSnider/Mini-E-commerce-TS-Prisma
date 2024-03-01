import { describe, it } from "node:test";
import { expect } from "@jest/globals";
import {  } from "../../controllers/UserController";

describe("User Registration", () => {
  it("should create a new user", async () => {
    const userData = {
      username: "Teste",
      email: "w6V5S@example.com",
      password: "123456",
    };

    const registered = await createUser(userData);

    expect(registered.error).toBeFalsy();
    expect(registered.user).toBeDefined();
    expect(registered.user.username).toBe(userData.username);
    expect(registered.user.email).toBe(userData.email);
    expect(registered.user.id).toBeDefined();
  });
});
