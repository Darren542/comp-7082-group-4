import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import { mockData } from "./mock";

dotenv.config();

const PORT = process.env.PORT || 5000;

function updateAddon(name: string, active: boolean, installed: boolean) {
  const addon = mockData.installedAddons.find((addon) => addon.name === name);
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

app.get("/api/points", (req, res) => {
  // Mock points data
  const points = [
    { lat: 40.7128, lon: -74.006 }, // New York
    { lat: 34.0522, lon: -118.2437 }, // Los Angeles
    { lat: 51.5074, lon: -0.1278 }, // London
  ];
  res.json(points);
});

app.get("/api/addons", (req, res) => {
  // Mock installed data
  res.json(mockData.installedAddons);
});

app.post("/api/addons", (req, res) => {
  const { name, active, installed } = req.body;
  updateAddon(name, active, installed);
  res.json(mockData.installedAddons);
});

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
