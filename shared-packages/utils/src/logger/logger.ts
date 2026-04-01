import winston from "winston";
import "@dotenvx/dotenvx/config";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "base.logs" }),
  ],
});

export default logger;
