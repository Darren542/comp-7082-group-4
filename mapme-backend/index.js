const express = require("express");
const cors = require("cors");

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

app.get("/api/available", (req, res) => {
  // Mock available data
  const available = [
    { name: "Test-Points-2", desc: "Test Points 2 Desc" }
  ];
  res.json(available);
});

app.get("/api/addons", (req, res) => {
  // Mock installed data
  const installed = [
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
  res.json(installed);
});

app.listen(5000, () => {
  console.log("Backend is running on http://localhost:5000");
});
