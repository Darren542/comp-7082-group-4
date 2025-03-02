export const APP_CONFIG = {
  ADDON_MANAGER_URL: import.meta.env.VITE_ADDON_MANAGER_URL as string || "http://localhost:5001/api",
  CESIUM_ACCESS_TOKEN: import.meta.env.VITE_CESIUM_ACCESS_TOKEN as string || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkYTBmZjk1NC0xOTg4LTRkMjItYTM5ZC0yZmI3Nzg2MzRkZGIiLCJpZCI6Mjc1MDA3LCJpYXQiOjE3MzkyNDUzNDN9.U_Cp7eldn_dirRdCrD_Y4FkwVn0MjaXuKdPxjswITzM"
}

export const ADDONS = {
  CANADA_TRAVEL_ADVISORY: "canadaTravelAdvisory",
  TICKETMASTER_EVENTS: "Ticketmaster",

}