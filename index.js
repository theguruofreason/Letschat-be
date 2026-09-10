import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import login from "./login.js";
import chat from "./chat.js";

dotenv.config();
const { PORT, LETSCHAT_FRONTEND_ORIGIN } = process.env;

const app = express();

app.use(cors());

app.get("/", (_, res) => {
    res.send("Let's Chat backend is ay-okay!");
});

app.use("/login", login);

app.listen(PORT, () => {
    console.log(`Let's Chat server is listening on port ${PORT}`);
});
