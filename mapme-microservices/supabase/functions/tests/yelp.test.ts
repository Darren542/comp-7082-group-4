import { assert } from "std/testing/asserts.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import "https://deno.land/std@0.224.0/dotenv/load.ts";

// Load from .env
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variable.");
}

// Create Supabase client once
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Shared coordinates for tests
const defaultCoords = { latitude: 49.2827, longitude: -123.1207 };

Deno.test("Yelp function returns valid results", async () => {
  const { data, error } = await supabase.functions.invoke("yelp", {
    body: { ...defaultCoords, radius: 100 },
  });

  assert(!error, `Expected no error but got: ${error?.message}`);
  assert(Array.isArray(data), "Expected data to be an array");

  if (data.length > 0) {
    const place = data[0];
    assert("id" in place);
    assert("name" in place);
    assert("rating" in place);
    assert("coordinates" in place);
    assert("categories" in place);
    assert("location" in place);
  }
});

Deno.test("Yelp returns multiple places for populated area", async () => {
  const { data, error } = await supabase.functions.invoke("yelp", {
    body: { latitude: 40.7128, longitude: -74.0060, radius: 1000 },
  });

  assert(!error, `Expected no error but got: ${error?.message}`);
  assert(Array.isArray(data));
  assert(data.length > 1, "Expected multiple businesses in a busy area");
});

Deno.test("Yelp handles small radius", async () => {
  const { data, error } = await supabase.functions.invoke("yelp", {
    body: { ...defaultCoords, radius: 10 },
  });

  assert(!error, `Expected no error but got: ${error?.message}`);
  assert(Array.isArray(data));
});

Deno.test("Yelp returns places with valid coordinates", async () => {
  const { data, error } = await supabase.functions.invoke("yelp", {
    body: { ...defaultCoords, radius: 100 },
  });

  assert(!error, `Expected no error but got: ${error?.message}`);
  assert(Array.isArray(data));

  for (const place of data ?? []) {
    const lat = Number(place.coordinates.latitude);
    const lon = Number(place.coordinates.longitude);
    assert(!isNaN(lat), "Latitude should be a number");
    assert(!isNaN(lon), "Longitude should be a number");
  }
});

Deno.test("Yelp returns businesses with a category", async () => {
  const { data, error } = await supabase.functions.invoke("yelp", {
    body: { ...defaultCoords, radius: 100 },
  });

  assert(!error, `Expected no error but got: ${error?.message}`);
  assert(Array.isArray(data));

  for (const place of data ?? []) {
    assert(Array.isArray(place.categories));
    assert("title" in place.categories[0]);
  }
});
