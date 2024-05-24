import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import dotenv from "dotenv";
dotenv.config();

import { sign, verify } from "jsonwebtoken";

interface User {
  id: string;
  username: string;
}

const createAccessToken = (user: User, expiresIn: number): string => {
  const accessToken = sign(
    {
      id: user.id,
      username: user.username,
    },
    process.env.JWT_ACCESS_TOKEN_SECRET!,
    {
      expiresIn: expiresIn,
    }
  );

  return accessToken;
};

const createRefreshToken = (user: User, expiresIn: number): string => {
  const refreshToken = sign(
    {
      id: user.id,
      username: user.username,
    },
    process.env.JWT_REFRESH_TOKEN_SECRET!,
    {
      expiresIn: expiresIn,
    }
  );

  return refreshToken;
};

const checkTokenHasTimeLeft = (token: string) => {
  const isValidToken = (token: string, secret: string): boolean => {
    try {
      verify(token, secret);
      return true;
    } catch (error) {
      return false;
    }
  };

  const decoded = verify(token, process.env.JWT_ACCESS_TOKEN_SECRET) as {
    exp: number;
  };
  const currentTime = Math.floor(Date.now() / 1000);
  const thresholdSeconds = 300;
  const expirationThreshold = currentTime + thresholdSeconds;

  if (!isValidToken(token, process.env.JWT_ACCESS_TOKEN_SECRET)) {
    throw new Error("Invalid access token!");
  }

  return decoded.exp < expirationThreshold;
};

const renewAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies["refreshToken"];

    if (!refreshToken) {
      return res.status(401).json({ error: true, message: "Unauthorized!" });
    }

    const decoded = verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET);

    if (!decoded) {
      return res
        .status(401)
        .json({ error: true, message: "Invalid refresh token!" });
    }

    const validAccessToken = await prisma.usersAccessTokens.findFirst({
      where: {
        user_id: (decoded as { id: string }).id,
        revoked: false,
      },
    });

    if (!validAccessToken) {
      return res.status(401).json({ error: true, message: "Unauthorized!" });
    }

    const validRefreshToken = await prisma.usersRefreshTokens.findFirst({
      where: {
        user_id: (decoded as { id: string }).id,
        revoked: false,
      },
    });

    if (!validRefreshToken) {
      return res.status(401).json({ error: true, message: "Unauthorized!" });
    }

    const newAccessToken = sign(
      {
        username: (decoded as { username: string }).username,
      },
      process.env.JWT_ACCESS_TOKEN_SECRET
    );

    const newAccessTokenAge = 24 * 60 * 60 * 1000;

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      maxAge: newAccessTokenAge,
      secure: true,
      sameSite: "none",
    });

    await prisma.usersAccessTokens.update({
      where: {
        id: validAccessToken.id,
      },
      select: {
        id: true,
        user_id: true,
        revoked: true,
      },
      data: {
        revoked: true,
      },
    });

    await prisma.usersRefreshTokens.update({
      where: {
        id: validRefreshToken.id,
      },
      select: {
        id: true,
        user_id: true,
        revoked: true,
      },
      data: {
        revoked: true,
      },
    });

    await prisma.usersAccessTokens.create({
      data: {
        user_id: (decoded as { id: string }).id,
        access_token: newAccessToken,
        expiration_date: new Date(Date.now() + newAccessTokenAge),
      },
    });

    return next();
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .json({ error: true, message: "Not authorized or invalid credentials." });
  }
};

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies["accessToken"];

  if (!accessToken) {
    return renewAccessToken(req, res, next);
  }

  try {
    const validAccessToken = verify(
      accessToken,
      process.env.JWT_ACCESS_TOKEN_SECRET
    );

    if (!validAccessToken) {
      return res
        .status(401)
        .json({ error: true, message: "Not authorized or invalid credentials." });
    }

    const isValidToken = checkTokenHasTimeLeft(accessToken);

    if (!isValidToken) {
      await prisma.usersAccessTokens.update({
        where: {
          user_id: (validAccessToken as { id: string }).id,
          access_token: accessToken,
        },
        data: {
          revoked: true,
        },
      });
    } else {
      return renewAccessToken(req, res, next);
    }

    return next();
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .json({ error: true, message: "Not authorized or invalid credentials." });
  }
};

export { createAccessToken, createRefreshToken, verifyToken, renewAccessToken };
