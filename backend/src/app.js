import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes.js";
import physioRoutes from "./modules/physio/physio.routes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "physiovision-backend",
    });
});

app.use("/api/auth", authRoutes);

app.use("/api/physio", physioRoutes);

export default app;
