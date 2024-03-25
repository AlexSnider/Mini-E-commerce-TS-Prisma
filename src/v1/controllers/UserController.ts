import {
  CustomValidationException,
  NotFoundException,
} from "../controllers/customExceptions/customExceptions";

import { Request, Response } from "express";
import { prisma } from "../../database";
import { createAccessToken, createRefreshToken } from "../../auth/jwt";
import argon2 from "argon2";
import logger from "../../utils/log/logger";
import LoggerPattern from "../../utils/log/loggerPattern";

export interface User {
  username: string;
  password: string;
  email: string;
}

export const registerUser = async (userData: User, Request: Request, Response: Response) => {
  try {
    const { username, password, email } = userData;

    const endpoint = Request.originalUrl;

    if (!username || !password || !email) {
      const logData = new LoggerPattern({
        who: username,
        what: "Tryed to register with missing fields",
        where: endpoint,
      });

      logger.log({
        level: "warn",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });
      return Response.status(400).json({ error: true, message: "Missing required fields!" });
    }

    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          {
            username: username,
          },
          {
            email: email,
          },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (existingUser) {
      const logData = new LoggerPattern({
        who: username,
        what: "Tryed to register with existing user or email",
        where: endpoint,
      });

      logger.log({
        level: "warn",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });
      return Response.status(400).json({ error: true, message: "User or Email already exists!" });
    }

    try {
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 1024,
        timeCost: 5,
        parallelism: 1,
      });

      const newUser = await prisma.users.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });

      Response.location(`${endpoint}/${newUser.id}`);

      const logData = new LoggerPattern({
        who: username,
        what: "Successfully registered",
        where: endpoint,
      });

      logger.log({
        level: "info",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });

      return Response.status(201).json({ error: false, message: "User created successfully!" });
    } catch (error) {
      return Response.status(400).json({ error: true, message: "Error while hashing password!" });
    }
  } catch (error) {
    if (error instanceof CustomValidationException) {
      return Response.status(400).json({ error: true, message: error.message });
    } else if (error instanceof NotFoundException) {
      return Response.status(404).json({ error: true, message: error.message });
    } else {
      const logData = new LoggerPattern({
        what: "Critical error crashed the server - Check logs",
        where: Request.originalUrl,
      });

      logger.log({
        level: "error",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });
      console.log(error);
      return Response.status(500).json({ error: true, message: "Internal server error!" });
    }
  }
};

export const loginUser = async (userData: User, Request: Request, Response: Response) => {
  try {
    const { username, password } = userData;

    const endpoint = Request.originalUrl;

    if (!username || !password) {
      const logData = new LoggerPattern({
        who: username,
        what: "Tryed to login with missing fields",
        where: endpoint,
      });

      logger.log({
        level: "warn",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });
      return Response.status(400).json({ error: true, message: "Missing required fields!" });
    }

    const existingToken = Request.cookies["accessToken"];

    if (existingToken) {
      const logData = new LoggerPattern({
        who: username,
        what: "Tryed to login while already logged in",
        where: endpoint,
      });

      logger.log({
        level: "warn",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });
      return Response.status(400).json({ error: true, message: "User already logged in!" });
    }

    const existingUser = await prisma.users.findUnique({
      where: {
        username,
      },

      select: {
        id: true,
        username: true,
        password: true,
      },
    });

    if (!existingUser) {
      const logData = new LoggerPattern({
        who: username,
        what: "Tryed to login with invalid credentials",
        where: endpoint,
      });

      logger.log({
        level: "warn",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });
      return Response.status(404).json({ error: true, message: "User or Password are invalid!" });
    }

    const passwordMatch = await argon2.verify(existingUser.password, password);

    if (!passwordMatch) {
      const logData = new LoggerPattern({
        who: username,
        what: "Tryed to login with invalid credentials",
        where: endpoint,
      });

      logger.log({
        level: "warn",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });
      return Response.status(400).json({ error: true, message: "Invalid credentials!" });
    }

    const accessTokenDuration = 60 * 60 * 1000;
    const refreshTokenDuration = 7 * 24 * 60 * 60 * 1000;

    const accessToken = createAccessToken(existingUser, accessTokenDuration);
    const refreshToken = createRefreshToken(existingUser, refreshTokenDuration);

    if (!accessToken || !refreshToken) {
      const logData = new LoggerPattern({
        who: username,
        what: "Had an error while creating tokens",
        where: endpoint,
      });

      logger.log({
        level: "warn",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });
      return Response.status(500).json({ error: true, message: "Error while creating tokens!" });
    }

    await prisma.usersAccessTokens.create({
      data: {
        user_id: existingUser.id,
        access_token: accessToken,
        expiration_date: new Date(Date.now() + accessTokenDuration),
      },
    });

    await prisma.usersRefreshTokens.create({
      data: {
        user_id: existingUser.id,
        refresh_token: refreshToken,
        expiration_date: new Date(Date.now() + refreshTokenDuration),
      },
    });

    Response.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: accessTokenDuration,
    });

    Response.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: refreshTokenDuration,
    });

    const logDataTokens = new LoggerPattern({
      who: username,
      what: "Tryed to login and created tokens successfully",
      where: endpoint,
    });

    logger.log({
      level: "info",
      message: logDataTokens.log(),
      ...logDataTokens.toWinstonLog(),
    });

    const logData = new LoggerPattern({
      who: username,
      what: "Logged in successfully",
      where: endpoint,
    });

    logger.log({
      level: "info",
      message: logData.log(),
      ...logData.toWinstonLog(),
    });
    return Response.status(200).json({ error: false, message: "User logged in successfully!" });
  } catch (error) {
    if (error instanceof CustomValidationException) {
      return Response.status(400).json({ error: true, message: error.message });
    } else if (error instanceof NotFoundException) {
      return Response.status(404).json({ error: true, message: error.message });
    } else {
      console.log(error);
      const logData = new LoggerPattern({
        what: "Critical error crashed the server - Check logs",
        where: Request.originalUrl,
      });

      logger.log({
        level: "error",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });
      return Response.status(500).json({ error: true, message: "Internal server error!" });
    }
  }
};

export const findUser = async (Request: Request, Response: Response) => {
  try {
    const endpoint = Request.originalUrl;

    const page = Request.query.page ? Number(Request.query.page) : 1;
    const pageSize = Request.query.limit ? Number(Request.query.limit) : 10;

    const offset = (page - 1) * pageSize;

    const users = await prisma.users.findMany({
      skip: offset,
      take: pageSize,
    });

    if (!users) {
      const logData = new LoggerPattern({
        what: "An attempt to find users have been requested",
        where: endpoint,
      });

      logger.log({
        level: "warn",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });

      return Response.status(404).json({ error: true, message: "No users found!" });
    }

    return Response.status(200).json(users);
  } catch (error) {
    const logData = new LoggerPattern({
      what: "An attempt to find users origined a fatal error!",
      where: Request.originalUrl,
    });

    logger.log({
      level: "error",
      message: logData.log(),
      ...logData.toWinstonLog(),
    });
    console.log(error);
    return Response.status(500).json({ error: true, message: "Oops! Something went wrong!" });
  }
};
