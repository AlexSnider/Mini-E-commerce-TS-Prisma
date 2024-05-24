import rateLimit from "express-rate-limit";
import logger from "../utils/log/logger";
import LoggerPattern from "../utils/log/loggerPattern";

export const routeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    const logData = new LoggerPattern({
      ipAddress: req.socket.remoteAddress,
      what: "Route rate limit exceeded",
      where: req.originalUrl,
      when: new Date().toISOString(),
      why: "Too many requests for this route",
    });

    logger.log({
      level: "warn",
      message: logData.log(),
      ...logData.toWinstonLog(),
    });

    res.status(429).json({ error: true, message: "Route rate limit exceeded!" });
  },
});
