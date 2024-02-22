import { prisma } from "../database";
import argon2 from "argon2";

interface User {
  username: string;
  email: string;
  password: string;
}

export const createUser = async (userData: User) => {
  try {
    const { username, email, password } = userData;

    const userExist = await prisma.user.findUnique({
      where: { email },
    });

    if (userExist) {
      return {
        error: true,
        message: "User already exists",
        statusCode: 400,
      };
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 1024,
      timeCost: 3,
      parallelism: 1,
    });

    const createdUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return {
      error: false,
      message: "User created successfully!",
      user: createdUser,
      statusCode: 201,
    };
  } catch (error) {
    console.log(error);
    return {
      error: true,
      message: "Internal server error",
      statusCode: 500,
    };
  }
};
