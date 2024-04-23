import rateLimit from "express-rate-limit";
import logger from "../utils/log/logger";
import LoggerPattern from "../utils/log/loggerPattern";

export const serverRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    const logData = new LoggerPattern({
      what: "Server rate limit exceeded",
      where: req.originalUrl,
      when: new Date().toISOString(),
      why: "Too many requests",
    });

    logger.log({
      level: "warn",
      message: logData.log(),
      ...logData.toWinstonLog(),
    });
    res.status(429).json({ error: true, message: "Server rate limit exceeded!" });
  },
});
