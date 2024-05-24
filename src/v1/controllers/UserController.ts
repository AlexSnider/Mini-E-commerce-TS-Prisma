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
import { verify } from "jsonwebtoken";
import { UserLoginInput } from "../../utils/interfaces/userLogin";
import { UserRegisterInput } from "../../utils/interfaces/userRegister";

export const registerUser = async (
  userData: UserRegisterInput,
  Request: Request,
  Response: Response
) => {
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
      return Response.status(400).json({
        error: true,
        message: "Missing required fields!",
      });
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
      return Response.status(400).json({
        error: true,
        message: "User or Email already exists!",
      });
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

      return Response.status(201).json({
        error: false,
        message: "User created successfully!",
      });
    } catch (error) {
      return Response.status(400).json({
        error: true,
        message: "Error while hashing password!",
      });
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
      return Response.status(500).json({
        error: true,
        message: "Internal server error!",
      });
    }
  }
};

export const loginUser = async (
  userData: UserLoginInput,
  Request: Request,
  Response: Response
) => {
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
      return Response.status(400).json({
        error: true,
        message: "Missing required fields!",
      });
    }

    const primaryToken = Request.cookies["accessToken"];

    if (primaryToken) {
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
      return Response.status(400).json({
        error: true,
        message: "User already logged in!",
      });
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
      return Response.status(404).json({
        error: true,
        message: "User or Password are invalid!",
      });
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
      return Response.status(401).json({
        error: true,
        message: "User or Password are invalid!",
      });
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
      return Response.status(500).json({
        error: true,
        message: "Error while creating tokens!",
      });
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
    return Response.status(200).json({
      error: false,
      message: "User logged in successfully!",
    });
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
      return Response.status(500).json({
        error: true,
        message: "Internal server error!",
      });
    }
  }
};

export const logoutUser = async (Request: Request, Response: Response) => {
  try {
    const endpoint = Request.originalUrl;

    const access_token = Request.cookies["accessToken"];

    const refresh_token = Request.cookies["refreshToken"];

    if (!access_token || !refresh_token) {
      return Response.status(400).json({
        error: true,
        message: "No tokens found!",
      });
    }

    const validAccessToken = verify(
      access_token,
      process.env.JWT_ACCESS_TOKEN_SECRET
    );
    const validRefreshToken = verify(
      refresh_token,
      process.env.JWT_REFRESH_TOKEN_SECRET
    );

    if (!validRefreshToken || !validAccessToken) {
      return Response.status(401).json({
        error: true,
        message: "Invalid refresh token or access token!",
      });
    }

    const checkIfAccessTokenIsRevoked =
      await prisma.usersAccessTokens.findFirst({
        where: {
          user_id: (validAccessToken as { id: string }).id,
          access_token: access_token,
        },

        select: {
          revoked: true,
        },
      });

    const checkIfRefreshTokenIsRevoked =
      await prisma.usersRefreshTokens.findFirst({
        where: {
          user_id: (validRefreshToken as { id: string }).id,
          refresh_token: refresh_token,
        },
        select: {
          revoked: true,
        },
      });

    if (
      checkIfAccessTokenIsRevoked?.revoked === true ||
      checkIfRefreshTokenIsRevoked?.revoked === true
    ) {
      Response.clearCookie("accessToken");
      Response.clearCookie("refreshToken");
    } else if (
      checkIfAccessTokenIsRevoked?.revoked === false ||
      checkIfRefreshTokenIsRevoked?.revoked === false
    ) {
      await prisma.usersAccessTokens.update({
        where: {
          user_id: (validAccessToken as { id: string }).id,
          access_token: access_token,
        },
        data: {
          revoked: true,
        },
      });

      await prisma.usersRefreshTokens.update({
        where: {
          user_id: (validRefreshToken as { id: string }).id,
          refresh_token: refresh_token,
        },
        data: {
          revoked: true,
        },
      });

      Response.clearCookie("accessToken");
      Response.clearCookie("refreshToken");
    }

    const logData = new LoggerPattern({
      what: "Logged out successfully",
      where: endpoint,
    });

    logger.log({
      level: "info",
      message: logData.log(),
      ...logData.toWinstonLog(),
    });

    Response.status(200).json({
      error: false,
      message:
        "If logged out sucessfully you'll be redirected to the login page!",
    });
  } catch (error) {
    Response.status(500).json({
      error: true,
      message: "Internal server error!",
    });

    const logData = new LoggerPattern({
      what: "Critical error crashed the route/server",
      where: Request.originalUrl,
    });

    logger.log({
      level: "error",
      message: logData.log(),
      ...logData.toWinstonLog(),
    });
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

      return Response.status(404).json({
        error: true,
        message: "No users found!",
      });
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
    return Response.status(500).json({
      error: true,
      message: "Oops! Something went wrong!",
    });
  }
};

export const findUserById = async (Request: Request, Response: Response) => {
  try {
    const endpoint = Request.originalUrl;

    const { id } = Request.params;

    const user = await prisma.users.findUnique({
      where: {
        id: String(id),
      },

      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      const logData = new LoggerPattern({
        what: "An attempt to find an user have been requested!",
        where: endpoint,
      });

      logger.log({
        level: "warn",
        message: logData.log(),
        ...logData.toWinstonLog(),
      });

      return Response.status(404).json({
        error: true,
        message: "The user may not be available.",
      });
    }

    const logData = new LoggerPattern({
      who: user.username,
      what: "Was retrieved successfully!",
      where: endpoint,
    });

    logger.log({
      level: "info",
      message: logData.log(),
      ...logData.toWinstonLog(),
    });

    return Response.status(200).json(user);
  } catch (error) {
    const logData = new LoggerPattern({
      what: "An attempt to find an user origined a fatal error!",
      where: Request.originalUrl,
    });

    logger.log({
      level: "error",
      message: logData.log(),
      ...logData.toWinstonLog(),
    });

    return Response.status(500).json({
      error: true,
      message: "Oops! Something went wrong!",
    });
  }
};
