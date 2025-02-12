const express = require("express");
const cors = require("cors");

// Mock Database for a single users addon status data
const installedAddons = [
  {
    name: "canadaTravelAdvisory",
    desc: "Canada Travel Advisory",
    active: true,
    installed: true,
    apiLocation: "http://localhost:5000/api/canadaTravelAdvisory",
  },
  { 
    name: "testAddon",
    desc: "Test Points Desc", 
    active: true, 
    installed: true,
    apiLocation: "http://localhost:5000/api/testAddon"
  },
  { 
    name: "testAddon2", 
    desc: "Test Points Desc 2", 
    active: false, 
    installed: false,
    apiLocation: "http://localhost:5000/api/testAddon2"
  },
  { 
    name: "testAddon3", 
    desc: "Test Points Desc 3", 
    active: false, 
    installed: false,
    apiLocation: "http://localhost:5000/api/testAddon2"
  },
  { 
    name: "testAddon4", 
    desc: "Test Points Desc 4", 
    active: false,
    installed: true,
    apiLocation: "http://localhost:5000/api/testAddon2"
  }
];

function updateAddon(name, active, installed) {
  const addon = installedAddons.find((addon) => addon.name === name);
  if (addon) {
    addon.active = active;
    addon.installed = installed;
  }
}

const app = express();
app.use(cors());
app.use(express.json());

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
  res.json(installedAddons);
});

app.post("/api/addons", (req, res) => {
  const { name, active, installed } = req.body;
  updateAddon(name, active, installed);
  res.json(installedAddons);
});

app.listen(5000, () => {
  console.log("Backend is running on http://localhost:5000");
});
