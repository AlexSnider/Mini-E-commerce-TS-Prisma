import { createLogger, transports, format } from "winston";
import LoggerPattern from "./loggerPattern";

const logger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf((log) => {
      const logInstance = new LoggerPattern({
        who: log.who,
        ipAddress: log.ipAddress,
        what: log.what,
        where: log.where,
        when: log.when,
        why: log.why,
      });
      return `[${log.timestamp} | Tracer ID:${log.trace_id} | Span ID:${
        log.span_id
      }] [${log.level.toUpperCase()}] - ${logInstance.log()}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: "logs.log",
    }),
  ],
});

export default logger;
