import { Router } from "express";

const loginRouter = Router();

loginRouter.get("/", (_, res) => {
    res.send("login route is ay-okay!");
});

export default loginRouter;
