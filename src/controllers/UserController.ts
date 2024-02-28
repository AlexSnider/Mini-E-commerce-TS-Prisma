import {
  CustomValidationException,
  NotFoundException,
} from "../controllers/customExceptions/customExceptions";

import { Request, Response } from "express";
import { prisma } from "../database";
import argon2 from "argon2";

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

    const existingUser = await prisma.user.findFirst({
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

      const newUser = await prisma.user.create({
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
