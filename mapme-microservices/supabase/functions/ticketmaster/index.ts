import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import ngeohash from "npm:ngeohash"
import { corsHeaders } from "../_shared/cors.ts"

const API_KEY = Deno.env.get("TICKETMASTER_API_KEY");
const BASE_TICKETMASTER_API_URL = "https://app.ticketmaster.com";
const TICKETMASTER_API_URL = "https://app.ticketmaster.com/discovery/v2/events/";

interface Event {
  id: string;
  name: string;
  url: string;
  dates: {
    start: {
      localDate: string;
    },
    end: {
      localDate: string;
    }
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      location?: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
}

async function fetchAllEvents(url: string, page = 0, collectedData: any[] = []): Promise<any[]> {
  let response;
  try {
    response = await fetch(url);
  } catch (fetchErr) {
    throw new Error(`Unable to reach Tickemaster API: ${fetchErr}`);
  }

  const data = await response.json();

  if (data?._embedded?.events) {
    // Create custom Event object for every event and add to array
    for (const event of data?._embedded?.events) {
      const eventToAdd: Event = {
        id: event.id,
        name: event.name,
        url: event.url ?? "",
        dates: {
          start: {
            localDate: event.dates?.start?.localDate
          },
          end: {
            localDate: event.dates?.end?.localDate
          }
        },
        _embedded: {
          venues: event._embedded?.venues?.map((venue: {
            name: string;
            location: {
              latitude: string;
              longitude: string;
            };
          }) => ({
            name: venue.name,
            location: {
              latitude: venue.location?.latitude,
              longitude: venue.location?.longitude,
            }
          })) ?? []
        }
      }

      collectedData.push(eventToAdd);
    }
  };

  // If there is more than 1 page, recursively call fetchAllFunctions with the events collected so far to create one big list
  if (data?.page?.totalPages > page + 1) {
    const next_url = BASE_TICKETMASTER_API_URL + data?._links?.next.href + "&apikey=" + API_KEY;
    const nextData = await fetchAllEvents(next_url, page + 1, collectedData);
    return nextData;  }

  return collectedData;
}

function getISODateString(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0))
    .toISOString()
    .replace(".000", "");
}

Deno.serve(async (req) => {
  // For CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let { latitude, longitude, city, radius } = await req.json();

    if (!((latitude && longitude) || city)) {
      return new Response(JSON.stringify({ error: "Either Latitude and Longitude or City is Required"}), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      return new Response(JSON.stringify({ error: "Latitude and Longitude must be numbers"}), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((latitude < -90 || latitude > 90)) {
      return new Response(JSON.stringify({ error: "Latitude must be between -90 to 90 degrees"}), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((longitude < -180 || longitude > 180)) {
      return new Response(JSON.stringify({ error: "Longitude must be between -180 to 180 degrees"}), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({ apikey: API_KEY || "" });
    if (latitude && longitude) {
      // Create geohash
      const geohash = ngeohash.encode(latitude, longitude);
      if (parseInt(radius) > 100) {
        radius = 100;
      }
      params.append("geoPoint", geohash);
      params.append("radius", radius);
      params.append("unit", "km");
      
      // Today's date
      const today = new Date();
      
      // Today's date + 1 week
      const nextWeek = new Date(today);
      nextWeek.setUTCDate(today.getUTCDate() + 14);
      const nextWeekISO = getISODateString(nextWeek);
            
      params.append("endDateTime", nextWeekISO);
    }
    if (city) params.append("city", city);

    try {
      const apiurl = `${TICKETMASTER_API_URL}?${params.toString()}`;
      console.log(`Query URL: ${apiurl}`)
      const allEvents = await fetchAllEvents(apiurl);

      return new Response(JSON.stringify(allEvents), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to fetch data:" + error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      },
      status: 400,
    })
  }

  
})
