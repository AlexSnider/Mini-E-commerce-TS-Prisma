import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { prisma } from "../../../../src/database";
import { loginUser } from "../../../../src/v1/controllers/UserController";
import logger from "../../../../src/utils/log/logger";

jest.mock("../../../../utils/log/logger", () => ({
  log: jest.fn(),
}));

jest.mock("../../../../auth/jwt", () => ({
  createAccessToken: jest.fn().mockReturnValue(undefined),
  createRefreshToken: jest.fn().mockReturnValue(undefined),
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
  describe("Tests User Unsuccessful Logins", () => {
    test("should return an error if user is already logged in.", async () => {
      const userData = {
        username: "testuser",
        password: "testpassword",
      };

      const request = {
        originalUrl: "/v1/login",
        cookies: {
          accessToken: "testtoken",
        },
      } as unknown as Request;

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        location: jest.fn(),
        cookie: jest.fn(),
      } as unknown as Response;

      await loginUser(userData, request, response);

      expect(logger.log).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: true,
        message: "User already logged in!",
      });
    });

    test("should return an error if user was not found.", async () => {
      const userData = {
        username: "wrongtestuser",
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
      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({
        error: true,
        message: "User or Password are invalid!",
      });
    });

    test("should return an error if password is incorrect.", async () => {
      const userData = {
        username: "testuser",
        password: "wrongtestpassword",
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
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: true,
        message: "User or Password are invalid!",
      });
    });

    test("should return an error if required fields are missing.", async () => {
      const userData = {
        username: "",
        password: "",
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

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: true,
        message: "Missing required fields!",
      });
    });

    test("should return an error if tokens were not created.", async () => {
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
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: true,
        message: "Error while creating tokens!",
      });
    });

    test("should return an error if the server crashed.", async () => {
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

      jest.spyOn(logger, "log").mockImplementationOnce(() => {
        throw new Error();
      });

      await loginUser(userData, request, response);

      expect(logger.log).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: true,
        message: "Internal server error!",
      });
    });
  });
});
