import { CustomValidationException, NotFoundException } from "./customExceptions/customExceptions";
import { Request, Response } from "express";
import { prisma } from "../../database";
import Logger from "../../utils/log/logger";
import LoggerPattern from "../../utils/log/loggerPattern";

interface User {
  username: string;
  password: string;
  email: string;
}

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

      Logger.log({
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

    Logger.log({
      level: "error",
      message: logData.log(),
      ...logData.toWinstonLog(),
    });
    console.log(error);
    return Response.status(500).json({ error: true, message: "Oops! Something went wrong!" });
  }
};
