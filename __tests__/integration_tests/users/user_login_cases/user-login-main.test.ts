import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { prisma } from "../../../../src/database";
import { loginUser } from "../../../../src/v1/controllers/UserController";
import logger from "../../../../src/utils/log/logger";

jest.mock("../../../../utils/log/logger", () => ({
  log: jest.fn(),
}));

describe("User Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.usersAccessTokens.deleteMany({
      where: {
        user_id: {
          contains: "c857c86b-20d4-4df6-9fcf-c54a19c97ac9",
        },
      },
    });

    await prisma.usersRefreshTokens.deleteMany({
      where: {
        user_id: {
          contains: "c857c86b-20d4-4df6-9fcf-c54a19c97ac9",
        },
      },
    });
  });
  describe("Tests User Successful Login", () => {
    test("should return success if user was logged in.", async () => {
      const userData = {
        username: "testuser",
        password: "testpassword",
      };

      const request = {
        originalUrl: "/v1/login",
        cookies: {},
      } as unknown as Request;

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        location: jest.fn(),
        cookie: jest.fn(),
      } as unknown as Response;

      await loginUser(userData, request, response);

      expect(logger.log).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        error: false,
        message: "User logged in successfully!",
      });
    });
  });
});
