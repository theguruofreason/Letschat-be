import { Router } from "express";
import crypto from "node:crypto";
import db from "./db.js";
import jwt from "jsonwebtoken";
const { JWT_SECRET } = process.env;

export const authRouter = Router();

authRouter.get("/", (_, res) => {
    res.send("auth route is ay-okay!");
});

authRouter.post("/register", async (req, res) => {
    const { user, password } = req.body;
    const usersCollection = db.collection("users");
    if ((await usersCollection.findOne({ user: user })) != null) {
        res.status(400).json({ message: "Username already exists." });
        return;
    }
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, hashedPassword) => {
        if (err) {
            res.sendStatus(500);
            throw new Error(err);
        }
        usersCollection
            .insertOne({
                user: user,
                password: hashedPassword.toString("hex"),
                salt: salt,
            })
            .then((_) => res.status(200).send("User registered."))
            .catch((err) => {
                res.sendStatus(500);
                throw new Error(err);
            });
    });
    return;
});

authRouter.post("/login", async (req, res) => {
    const { user, password } = req.body;
    if (user === undefined || password === undefined) {
        res.status(400).send("user and password are required.");
        return;
    }

    const userInfo = await db.collection("users").findOne({ user: user });

    if (userInfo === null) {
        res.status(401).send("Invalid credentials.");
        return;
    }

    crypto.scrypt(password, userInfo.salt, 64, (err, hashedPassword) => {
        if (err) throw new Error(err);
        if (
            !crypto.timingSafeEqual(
                Buffer.from(userInfo.password, "hex"),
                hashedPassword,
            )
        ) {
            res.status(401).json("Invalid credentials.");
        } else {
            const accessToken = jwt.sign({ user }, JWT_SECRET, {
                expiresIn: "5m",
            });
            const refreshToken = jwt.sign({ user }, JWT_SECRET, {
                expiresIn: "30d",
            });
            db.collection("users").updateOne(
                { user },
                { $set: { refresh: Date.now() + 30 * 24 * 60 * 60 * 1000 } },
            );
            res.cookie("refresh_token", JSON.stringify(refreshToken), {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/auth/refresh",
                secure: true,
                sameSite: "Strict",
            })
                .status(200)
                .json(JSON.stringify({ accessToken }));
        }
        return;
    });
    return;
});

authRouter.get("/refresh", (req, res) => {
    const refreshToken = req.cookies.refresh_token.replaceAll('"', "");
    if (!refreshToken) {
        res.status(401).send("Invalid token.");
        return;
    }

    jwt.verify(refreshToken, JWT_SECRET, (err, decodedToken) => {
        if (err) {
            console.error(err);
            res.status(401).send("Invalid token.");
            return;
        }

        const userInfo = db
            .collection("users")
            .findOne({ user: decodedToken.user });
        if (userInfo.refresh <= Date.now()) {
            console.error("Token is expired in DB.");
            res.status(401).send("Invalid token.");
            return;
        }

        const accessToken = jwt.sign({ user: decodedToken.user }, JWT_SECRET, {
            expiresIn: "1h",
        });
        res.status(200).json(JSON.stringify({ accessToken }));
        return;
    });
    return;
});

authRouter.get("/test", auth, (_, res) => {
    res.status(200).send("Looks good!");
    return;
});

export function auth(req, res, next) {
    const accessToken = req.get("authorization").replace("bearer ", "");
    jwt.verify(accessToken, JWT_SECRET, (err) => {
        if (err) {
            res.status(401).send("Invalid token.");
            return;
        }

        next();
        return;
    });
}
