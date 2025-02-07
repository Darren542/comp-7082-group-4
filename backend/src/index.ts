import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app: Express = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);  

app.get("/", (req: Request, res: Response) => {
    res.send("Backend is running");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));