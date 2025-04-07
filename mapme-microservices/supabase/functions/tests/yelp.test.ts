import { assert } from "std/testing/asserts.ts";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://qsnuignbeuiqzmiksjty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbnVpZ25iZXVpcXptaWtzanR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwOTA5OTQsImV4cCI6MjA1MzY2Njk5NH0.1bn-hf9P1l-r7ZrDQCB8zbZEygZRXQrUYB5YOX1IT_Q';

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

Deno.test('Yelp function returns valid results', async () => {
  const { data, error } = await supabase.functions.invoke("yelp", {
    body: { latitude: 49.2827, longitude: -123.1207, radius: 100 },
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

Deno.test('Yelp returns multiple places for populated area', async () => {
  const { data, error } = await supabase.functions.invoke("yelp", {
    body: { latitude: 40.7128, longitude: -74.0060, radius: 1000 }, // New York City
  });

  assert(!error, `Expected no error but got: ${error?.message}`);
  assert(Array.isArray(data));
  assert(data.length > 1, "Expected multiple businesses in a busy area");
});

Deno.test('Yelp handles small radius', async () => {
  const { data, error } = await supabase.functions.invoke("yelp", {
    body: { latitude: 49.2827, longitude: -123.1207, radius: 10 },
  });

  assert(!error, `Expected no error but got: ${error?.message}`);
  assert(Array.isArray(data));
});

Deno.test('Yelp returns places with valid coordinates', async () => {
  const { data, error } = await supabase.functions.invoke("yelp", {
    body: { latitude: 49.2827, longitude: -123.1207, radius: 100 },
  });

  assert(!error, `Expected no error but got: ${error?.message}`);
  assert(Array.isArray(data));

  if (data.length > 0) {
    for (const place of data) {
      const lat = Number(place.coordinates.latitude);
      const lon = Number(place.coordinates.longitude);
      assert(!isNaN(lat), "Latitude should be a number");
      assert(!isNaN(lon), "Longitude should be a number");
    }
  }
});



Deno.test('Yelp returns businesses with a category', async () => {
  const { data, error } = await supabase.functions.invoke("yelp", {
    body: { latitude: 49.2827, longitude: -123.1207, radius: 100 },
  });

  assert(!error, `Expected no error but got: ${error?.message}`);
  assert(Array.isArray(data));

  if (data.length > 0) {
    for (const place of data) {
      assert(Array.isArray(place.categories));
      assert("title" in place.categories[0]);
    }
  }
});

