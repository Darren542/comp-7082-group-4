// mapme-backend/src/Model/yelp.ts
import axios from "axios";

const YELP_API_KEY = process.env.YELP_API_KEY;

export async function searchYelp(latitude: number, longitude: number, radius: number, term = "restaurants") {
  try {
    const response = await axios.get("https://api.yelp.com/v3/businesses/search", {
      headers: {
        Authorization: `Bearer ${YELP_API_KEY}`,
      },
      params: {
        latitude,
        longitude,
        radius,
        term,
        limit: 50,
      },
    });

    return response.data.businesses;
  } catch (error: any) {
    console.error("Yelp API Error:", error.message);
    throw error;
  }
}