// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const API_KEY = Deno.env.get("TICKETMASTER_API_KEY");
const BASE_TICKETMASTER_API_URL = "https://app.ticketmaster.com";
const TICKETMASTER_API_URL = "https://app.ticketmaster.com/discovery/v2/events/";
// const CACHE_TTL = 3600; // Cache expires in 1 hour

// const kv = await Deno.openKv(); // Open Deno KV storage

async function fetchAndCacheResults(cacheKey: string, apiUrl: string) {
  // Check if results are in Cache first
  // const cached = await kv.get<{ data: any[]; timestamp: number }>([cacheKey])
  // if (cached.value) {
  //   console.log("Cache hit:", cacheKey);
  //   return cached.value.data;
  // }

  // console.log("Cache miss:", cacheKey);
  const allEvents = await fetchAllEvents(apiUrl);

  // Store results in cache
  // await kv.set([cacheKey], { data: allEvents, timestamp: Date.now() }, { expireIn: CACHE_TTL });

  return allEvents
}

async function fetchAllEvents(url: string, page = 0, collectedData: any[] = []): Promise<any[]> {
  const response = await fetch(`${url}`);
  const data = await response.json();

  if (data?._embedded?.events) {
    collectedData.push(...data._embedded.events);
  };

  if (data?.page?.totalPages > page + 1) {
    const next_url = BASE_TICKETMASTER_API_URL + data?._links?.next.href;
    console.log("Next URL:", next_url);
    return fetchAllEvents(next_url, page + 1, collectedData);
  }

  console.log("Collected data:", collectedData);
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
  const { latlong, city } = await req.json();
  console.log("City:", city);
  console.log("Latlong:", latlong);

  const page = 0;
  const pageSize = 20;

  if (!latlong && !city) {
    return new Response(JSON.stringify({ error: "latlong or city is required"}), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const params = new URLSearchParams({ apikey: API_KEY || "" });
  if (latlong) params.append("latlong", latlong);
  if (city) params.append("city", city);

  const cacheKey = `ticketmaster_${latlong || city}`;

  try {
    const apiurl = `${TICKETMASTER_API_URL}?${params.toString()}`;
    console.log(`Query URL: ${apiurl}`)
    const allEvents = await fetchAndCacheResults(cacheKey, apiurl);

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

  // const { name } = await req.json()
  // const data = {
  //   message: `Hello ${name}!`,
  // }

  // return new Response(
  //   JSON.stringify(data),
  //   { headers: { "Content-Type": "application/json" } },
  // )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ticketmaster' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
