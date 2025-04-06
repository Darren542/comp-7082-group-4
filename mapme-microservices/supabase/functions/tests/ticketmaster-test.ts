import { assert, assertEquals } from "std/testing/asserts.ts"
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = 'https://qsnuignbeuiqzmiksjty.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbnVpZ25iZXVpcXptaWtzanR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwOTA5OTQsImV4cCI6MjA1MzY2Njk5NH0.1bn-hf9P1l-r7ZrDQCB8zbZEygZRXQrUYB5YOX1IT_Q'
const options = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }

async function testClientCreation() {
    const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseKey, options)
    if (!supabaseUrl) throw new Error('supabaseUrl is required.')
    if (!supabaseKey) throw new Error('supabaseKey is required.')
    assertEquals(typeof supabaseClient, 'object');
}

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

async function testReturnDataForm() {
    const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseKey, options)

    const { data, error } = await supabaseClient.functions.invoke("ticketmaster", { 
      body: { latitude:'49.2767', longitude: '-123.111900000000015', radius: '100' },
    })

    if (error) {
      console.log(error)
      throw new Error('Invalid Response')
    }

    // Assert that data is an array
    assert(Array.isArray(data), "Expected data to be an array");

    // Assert that the first element has expected properties (basic check)
    if (data.length > 0) {
      const event = data[0];
      assert("id" in event, "Event should have an id");
      assert("name" in event, "Event should have a name");
      assert("url" in event, "Event should have a url");
      assert("dates" in event && typeof event.dates === "object", "Event should have dates");
      assert("start" in event.dates && typeof event.dates.start.localDate === "string", "Event should have start.localDate");
      assert("end" in event.dates && typeof event.dates.start.localDate == "string", "Event should have end.localDate");
    }
}

async function testInvalidInputParameters() {
  const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseKey, options);

  const invalidLatitude = { latitude: "abc", longitude: "-123.1119", radius: "10" } // invalid latitude
  const invalidLongitude = { latitude: "49.2767", longitude: "xyz", radius: "10" }   // invalid longitude
  const emptyCity = { city: "" } // empty city
  const emptyBody = {} // empty body
  
  // Testing invalid Latitude
  const { data: invalidLatData, error: invalidLatError } = await supabaseClient.functions.invoke("ticketmaster", { 
    body: invalidLatitude,
  });

  // Testing Invalid Longitude
  const { data: invalidLongData, error: invalidLongError } = await supabaseClient.functions.invoke("ticketmaster", { 
    body: invalidLongitude,
  });

  // Testing empty city
  const { data: emptyCityData, error: emptyCityError } = await supabaseClient.functions.invoke("ticketmaster", { 
    body: emptyCity,
  });

  // Testing empty body
  const { data: emptyBodyData, error: emptyBodyError } = await supabaseClient.functions.invoke("ticketmaster", { 
    body: emptyBody,
  });

  if (invalidLatData || invalidLongData || emptyCityData || emptyBodyData) {
    throw new Error('Invalid input parameters returning data')
  }

  if (invalidLatError && invalidLongError && emptyCityError && emptyBodyError) {
    const latErrorBody = await invalidLatError.context.json()
    const longErrorBody = await invalidLongError.context.json()
    const cityErrorBody = await emptyCityError.context.json()
    const bodyErrorBody = await emptyBodyError.context.json()

    assert(latErrorBody.error == "Latitude and Longitude must be numbers")
    assert(longErrorBody.error == "Latitude and Longitude must be numbers")
    assert(cityErrorBody.error == "Either Latitude and Longitude or City is Required")
    assert(bodyErrorBody.error == "Either Latitude and Longitude or City is Required")
  }
}

async function testConcurrentRequestsWithTiming() {
  const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseKey, options);

  const responseTimes: string[] = []

  const requests = Array.from({ length: 10 }).map(async (_, i) => {
    const start = performance.now();

    const response = await supabaseClient.functions.invoke("ticketmaster", {
      body: { latitude: "49.2767", longitude: "-123.1119", radius: "10" }
    });

    const duration = performance.now() - start;

    responseTimes.push(duration.toFixed(2))
    return { ...response, duration };
  });

  const results = await Promise.all(requests);

  for (const { data, error, duration } of results) {
    assert(!error, `Expected no error (duration: ${duration} ms)`);
    assert(Array.isArray(data), "Expected data to be an array");
  }

  // Assert all requests took less than 2 seconds
  for (const responseTime of responseTimes) {
    assert(parseInt(responseTime) < 2000)
  }
}




Deno.test('Test Supabase Client Initialization', testClientCreation);
Deno.test('Test Return Data is Expected Form', testReturnDataForm);
Deno.test('Test Invalid Input Parameters', testInvalidInputParameters);
Deno.test('Test Many Users Concurrently', testConcurrentRequestsWithTiming);