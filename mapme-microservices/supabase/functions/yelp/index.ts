// supabase/functions/yelp/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

const API_KEY = Deno.env.get("YELP_API_KEY");

interface YelpBusiness {
  id: string;
  name: string;
  url: string;
  rating: number;
  image_url: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  categories: {
    title: string;
  }[];
  location: {
    address1: string;
    city: string;
    country: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 1000, term = "restaurants" } = await req.json();

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: "Latitude and Longitude are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL("https://api.yelp.com/v3/businesses/search");
    url.searchParams.set("latitude", latitude.toString());
    url.searchParams.set("longitude", longitude.toString());
    url.searchParams.set("radius", radius.toString());
    url.searchParams.set("term", term);
    url.searchParams.set("limit", "50");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.description || "Yelp API request failed.");
    }

    const result = await response.json();

    // Return just the businesses array
    return new Response(JSON.stringify(result.businesses as YelpBusiness[]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }
});
