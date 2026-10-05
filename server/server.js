import dotenv from "dotenv";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { logEvent, redact } from "./utils/logger.js";

dotenv.config();

const port = Number(process.env.PORT) || 5000;
const app = createApp();

connectDb()
  .then(() => {
    const server = app.listen(port, () => {
      logEvent("info", { status: "listening", port });
    });

    function shutdown(signal) {
      logEvent("info", { status: "shutdown", signal });
      server.close(() => {
        mongoose.connection.close(false).finally(() => process.exit(0));
      });
      setTimeout(() => process.exit(1), 10000).unref();
    }

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((error) => {
    logEvent("error", { status: "database_unavailable", message: redact(error.message) });
    process.exit(1);
  });
