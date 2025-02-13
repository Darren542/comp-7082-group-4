// Mock Database for a single users addon status data
export const installedAddons = [
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