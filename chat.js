import { Router } from "express";
import { auth } from "./auth.js";
import jwt from "jsonwebtoken";
const { JWT_SECRET } = process.env;
import db from "./db.js";
import { wss } from "./index.js";

// WebSocket
export function onConnect(ws, req) {
    console.log("New client connected.");
    const token = new URL(req.url, "http://localhost").searchParams.get(
        "token",
    );
    const user = jwt.decode(token, JWT_SECRET).user;

    ws.on("message", (message) => {
        db.collection("chatHistory")
            .insertOne({
                user,
                date: Date.now(),
                message: message.toString("utf-8"),
            })
            .then((result) => {
                console.log(result);
            })
            .catch((err) => console.error(err));
        const outgoing = {
            user,
            message: message.toString("utf-8"),
        };
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(outgoing));
            }
        });
    });

    ws.on("close", () => {
        console.log("A client disconnected.");
    });
}

export function onUpgrade(req, socket) {
    const token = new URL(req.url, "http://localhost").searchParams.get(
        "token",
    );

    if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
    }

    try {
        jwt.verify(token, JWT_SECRET);
    } catch (err) {
        console.error(err);
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
    }
}

// Router
const chatRouter = Router();

chatRouter.get("/", (_, res) => {
    res.send("Chat route is ay-okay!");
});

chatRouter.get("/history", (req, res) => {});

chatRouter.get("/connect", auth, (req, res) => {});

export default chatRouter;
