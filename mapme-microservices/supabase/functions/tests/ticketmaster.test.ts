import { assert, assertEquals } from "std/testing/asserts.ts";
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variable.");
}

const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, options);

interface Event {
  id: string;
  name: string;
  url: string;
  dates: {
    start: { localDate: string };
    end: { localDate: string };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      location?: { latitude: string; longitude: string };
    }>;
  };
}

Deno.test('Test Supabase Client Initialization', () => {
  assertEquals(typeof supabase, 'object');
});

Deno.test('Test Return Data is Expected Form', async () => {
  const { data, error } = await supabase.functions.invoke("ticketmaster", {
    body: { latitude: '49.2767', longitude: '-123.111900000000015', radius: '100' },
  });

  assert(!error, `Unexpected error: ${error?.message}`);
  assert(Array.isArray(data), "Expected data to be an array");

  if (data.length > 0) {
    const event = data[0];
    assert("id" in event);
    assert("name" in event);
    assert("url" in event);
    assert("dates" in event);
    assert("start" in event.dates);
    assert(typeof event.dates.start.localDate === "string");
    assert("end" in event.dates);
  }
});

Deno.test('Test Invalid Input Parameters', async () => {
  const cases = [
    { body: { latitude: "abc", longitude: "-123.1119", radius: "10" }, expected: "Latitude and Longitude must be numbers" },
    { body: { latitude: "49.2767", longitude: "xyz", radius: "10" }, expected: "Latitude and Longitude must be numbers" },
    { body: { city: "" }, expected: "Either Latitude and Longitude or City is Required" },
    { body: {}, expected: "Either Latitude and Longitude or City is Required" },
  ];

  for (const { body, expected } of cases) {
    const { data, error } = await supabase.functions.invoke("ticketmaster", { body });
    assert(!data, "Expected no data for invalid input");
    const errorBody = await error?.context.json();
    assertEquals(errorBody?.error, expected);
  }
});

Deno.test('Test Many Users Concurrently', async () => {
  const responseTimes: string[] = [];

  const requests = Array.from({ length: 10 }).map(async () => {
    const start = performance.now();

    const { data, error } = await supabase.functions.invoke("ticketmaster", {
      body: { latitude: "49.2767", longitude: "-123.1119", radius: "10" }
    });

    const duration = performance.now() - start;
    responseTimes.push(duration.toFixed(2));

    assert(!error);
    assert(Array.isArray(data));
  });

  await Promise.all(requests);

  for (const time of responseTimes) {
    assert(parseInt(time) < 2000);
  }
});
