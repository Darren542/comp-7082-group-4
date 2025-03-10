// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import ngeohash from "npm:ngeohash"

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
  const response = await fetch(`${url}`);
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

  if (data?.page?.totalPages > page + 1) {
    const next_url = BASE_TICKETMASTER_API_URL + data?._links?.next.href;
    console.log("Next URL:", next_url);
    return fetchAllEvents(next_url, page + 1, collectedData);
  }

  return collectedData;
}

// Paginate responses for client
function paginateResults(data: any[], page: number, pageSize: number) {
  const start = page * pageSize;
  const end = start + pageSize;
  return {
    results: data.slice(start, end),
    currentPage: page,
    totalPages: Math.ceil(data.length / pageSize),
  };
}

Deno.serve(async (req) => {
  const { latitude, longitude, city, radius } = await req.json();

  if (!((latitude && longitude) || city)) {
    return new Response(JSON.stringify({ error: "Either Latitude and Longitude or City is Required"}), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const params = new URLSearchParams({ apikey: API_KEY || "" });
  if (latitude && longitude) {
    // Create geohash
    const geohash = ngeohash.encode(latitude, longitude);
    console.log(geohash);
    params.append("geoPoint", geohash);
  }
  if (city) params.append("city", city);

  try {
    const apiurl = `${TICKETMASTER_API_URL}?${params.toString()}`;
    console.log(`Query URL: ${apiurl}`)
    const allEvents = await fetchAllEvents(apiurl);

    // Paginate results for the clinet
    // const paginatedResponse = paginateResults(allEvents, page, pageSize);

    return new Response(JSON.stringify(allEvents), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ticketmaster' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
