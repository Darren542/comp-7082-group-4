import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import { mockData } from "./mock";

dotenv.config();

const PORT = process.env.PORT || 5001;

function updateAddon(id: string, active: boolean, installed: boolean) {
  const addon = mockData.installedAddons.find((addon) => addon.id === id);
  if (addon) {
    addon.active = active;
    addon.installed = installed;
  }
}

const app: Express = express();
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Backend is running");
});

app.use("/auth", authRoutes); 

app.get("/api/addons", (req, res) => {
  // Mock installed data
  res.json(mockData.installedAddons);
});

app.post("/api/addons", (req, res) => {
  const { id, active, installed } = req.body;
  updateAddon(id, active, installed);
  res.json(mockData.installedAddons);
});

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
