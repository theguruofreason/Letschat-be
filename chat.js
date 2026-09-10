import { Router } from "express";

const chatRouter = Router();

chatRouter.get("/", (_, res) => {
    res.send("Chat route is ay-okay!");
});

export default chatRouter;
