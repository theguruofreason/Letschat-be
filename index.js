import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth.js";
import chatRouter from "./chat.js";

const { PORT, LETSCHAT_FRONTEND_ORIGIN } = process.env;

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get("/", (_, res) => {
    res.send("Let's Chat backend is ay-okay!");
});

app.use("/auth", authRouter);
app.use("/chat", chatRouter);

app.listen(PORT, () => {
    console.log(`Let's Chat server is listening on port ${PORT}`);
});
