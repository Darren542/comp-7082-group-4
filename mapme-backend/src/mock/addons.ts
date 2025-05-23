// Mock Database for a single users addon status data
export const installedAddons = [
  {
    id: "canadaTravelAdvisory",
    name: "Canada Travel Advisory",
    desc: "Latest travel advisories for Canada",
    active: true,
    installed: true,
    apiLocation: "http://localhost:5001/api/canadaTravelAdvisory",
  },
  { 
    id: "Ticketmaster",
    name: "Ticketmaster", 
    desc: "Ticketmaster Events", 
    active: true,
    installed: true,
    apiLocation: "http://localhost:5001/api/events"
  },
  { 
    id: "testAddon",
    name: "testAddon",
    desc: "Test Points Desc", 
    active: true, 
    installed: true,
    apiLocation: "http://localhost:5001/api/testAddon"
  },
  { 
    id: "testAddon2",
    name: "testAddon2", 
    desc: "Test Points Desc 2", 
    active: false, 
    installed: false,
    apiLocation: "http://localhost:5001/api/testAddon2"
  },
  { 
    id: "testAddon3",
    name: "testAddon3", 
    desc: "Test Points Desc 3", 
    active: false, 
    installed: false,
    apiLocation: "http://localhost:5001/api/testAddon2"
  },
  { 
    id: "testAddon4",
    name: "testAddon4", 
    desc: "Test Points Desc 4", 
    active: false,
    installed: true,
    apiLocation: "http://localhost:5001/api/testAddon2"
  },
  {
    id: "YELP_PLACES",
    name: "Yelp Places",
    desc: "Nearby food and business listings from Yelp",
    active: true,
    installed: true,
    apiLocation: "yelp"
  }
  
];