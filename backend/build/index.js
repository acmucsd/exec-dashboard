import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { memberStore } from "./src/db.js";
dotenv.config();
const app = express();
const port = Number(process.env.PORT ?? 3001);
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.get("/api/members", async (_req, res, next) => {
    try {
        const members = await memberStore.list();
        res.json(members);
    }
    catch (error) {
        next(error);
    }
});
app.post("/api/members", async (req, res, next) => {
    try {
        const member = await memberStore.create(req.body);
        res.status(201).json(member);
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/members/:id", async (req, res, next) => {
    try {
        const member = await memberStore.get(Number(req.params.id));
        if (!member) {
            res.status(404).json({ error: "Member not found" });
            return;
        }
        res.json(member);
    }
    catch (error) {
        next(error);
    }
});
app.put("/api/members/:id", async (req, res, next) => {
    try {
        const member = await memberStore.update(Number(req.params.id), req.body);
        if (!member) {
            res.status(404).json({ error: "Member not found" });
            return;
        }
        res.json(member);
    }
    catch (error) {
        next(error);
    }
});
app.delete("/api/members/:id", async (req, res, next) => {
    try {
        const deleted = await memberStore.delete(Number(req.params.id));
        if (!deleted) {
            res.status(404).json({ error: "Member not found" });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});
async function main() {
    await memberStore.init();
    app.listen(port, () => {
        console.log(`Members API listening on http://localhost:${port}`);
    });
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
