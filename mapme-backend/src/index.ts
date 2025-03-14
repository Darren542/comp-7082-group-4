import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import addonRoutes from "./routes/addon";

import { mockData } from "./mock";

dotenv.config();

const PORT = process.env.PORT || 5001;

const app: Express = express();
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Backend is running");
});

app.use("/auth", authRoutes); 

app.use("/api/addons", addonRoutes);

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
