import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";

dotenv.config();

const port = Number(process.env.PORT) || 5000;

const app = createApp();

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.info(JSON.stringify({ status: "listening", port }));
    });
  })
  .catch((error) => {
    console.error(JSON.stringify({ status: "database_unavailable" }));
    console.error(error.message);
    process.exit(1);
  });
