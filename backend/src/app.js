import express from "express";
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./modules/auth/auth.routes.js";
import physioRoutes from "./modules/physio/physio.routes.js";
import exerciseRoutes from "./modules/exercise/exercise.routes.js";
import assignmentRoutes from "./modules/assignment/assignment.routes.js";
import sessionRoutes from "./modules/session/session.routes.js";
import progressRoutes from "./modules/progress/progress.routes.js";
import connectionRoutes from "./modules/connections/connection.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "physiovision-backend",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/physio", physioRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/connections", connectionRoutes);

export default app;
