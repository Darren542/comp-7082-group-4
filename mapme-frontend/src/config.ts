export const APP_CONFIG = {
  ADDON_MANAGER_URL: import.meta.env.VITE_ADDON_MANAGER_URL as string || "http://localhost:5000/api",
  CESIUM_ACCESS_TOKEN: import.meta.env.VITE_CESIUM_ACCESS_TOKEN as string,
}

export const ADDONS = {
  CANADA_TRAVEL_ADVISORY: "canadaTravelAdvisory",
}