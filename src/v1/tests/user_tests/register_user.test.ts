import { describe, test, expect, afterAll } from "@jest/globals";
import { Request, Response } from "express";
import { prisma } from "../../../database";
import { registerUser } from "../../controllers/UserController";
import logger from "../../../utils/log/logger";

jest.mock("../../../utils/log/logger", () => ({
  log: jest.fn(),
}));

describe("User Controller", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.users.deleteMany({
      where: {
        email: {
          contains: "jest_test@example.com",
        },
      },
    });
  });
  describe("Register New User", () => {
    test("should register a new user.", async () => {
      const userData = {
        username: "testuser",
        password: "testpassword",
        email: "jest_test@example.com",
      };

      const request = {
        originalUrl: "/v1/register",
      } as Request;

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        location: jest.fn(),
      } as unknown as Response;

      await registerUser(userData, request, response);

      expect(logger.log).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith({
        error: false,
        message: "User created successfully!",
      });
    });

    describe("Error Handling", () => {
      test("should throw an error if any of the required fields are missing.", async () => {
        const userData = {
          username: "",
          password: "",
          email: "",
        };

        const request = {
          originalUrl: "/v1/register",
        } as Request;

        const response = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          location: jest.fn(),
        } as unknown as Response;

        await registerUser(userData, request, response);

        expect(logger.log).toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({
          error: true,
          message: "Missing required fields!",
        });
      });
    });

    describe("Error Handling", () => {
      test("should throw an error if username or email have already been registered.", async () => {
        const userData = {
          username: "testuser",
          password: "testpassword",
          email: "jest_test@example.com",
        };

        const request = {
          originalUrl: "/v1/register",
        } as Request;

        const response = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          location: jest.fn(),
        } as unknown as Response;

        await registerUser(userData, request, response);

        expect(logger.log).toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({
          error: true,
          message: "User or Email already exists!",
        });
      });
    });

    describe("Critical Error", () => {
      test("should throw an error if there is an unexpected error.", async () => {
        const userData = {
          username: "testuser",
          password: "testpassword",
          email: "jest_test@example.com",
        };

        const request = {
          originalUrl: "/v1/register",
        } as Request;

        const response = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          location: jest.fn(),
        } as unknown as Response;

        jest.spyOn(logger, "log").mockImplementationOnce(() => {
          throw new Error("Internal server error!");
        });

        await registerUser(userData, request, response);

        expect(logger.log).toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          error: true,
          message: "Internal server error!",
        });
      });
    });
  });
});
