import {
  CustomValidationException,
  NotFoundException,
} from "../controllers/customExceptions/customExceptions";

import { Request, Response } from "express";
import argon2 from "argon2";
import { prisma } from "../../database";
import { createAccessToken, createRefreshToken } from "../../auth/jwt";

interface User {
  username: string;
  password: string;
  email: string;
}

export const registerUser = async (userData: User, Request: Request, Response: Response) => {
  try {
    const { username, password, email } = userData;

    const endpoint = Request.originalUrl;

    if (!username || !password || !email) {
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
      return Response.status(500).json({ error: true, message: "Internal server error!" });
    }
  }
};

export const loginUser = async (userData: User, Request: Request, Response: Response) => {
  try {
    const { username, password } = userData;

    if (!username || !password) {
      return Response.status(400).json({ error: true, message: "Missing required fields!" });
    }

    const existingToken = Request.cookies["accessToken"];

    if (existingToken) {
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

    console.log(existingUser);

    if (!existingUser) {
      return Response.status(404).json({ error: true, message: "User not found!" });
    }

    const passwordMatch = await argon2.verify(existingUser.password, password);

    if (!passwordMatch) {
      return Response.status(400).json({ error: true, message: "Invalid credentials!" });
    }

    const accessTokenDuration = 1000;
    const refreshTokenDuration = 7 * 24 * 60 * 60 * 1000;

    const accessToken = createAccessToken(existingUser, accessTokenDuration);
    const refreshToken = createRefreshToken(existingUser, refreshTokenDuration);

    if (!accessToken || !refreshToken) {
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

    return Response.status(200).json({ error: false, message: "User logged in successfully!" });
  } catch (error) {
    if (error instanceof CustomValidationException) {
      return Response.status(400).json({ error: true, message: error.message });
    } else if (error instanceof NotFoundException) {
      return Response.status(404).json({ error: true, message: error.message });
    } else {
      console.log(error);
      return Response.status(500).json({ error: true, message: "Internal server error!" });
    }
  }
};
