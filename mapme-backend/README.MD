# MapMe Backend

[Supabase Project](https://supabase.com/dashboard/project/qsnuignbeuiqzmiksjty)

## Run the app locally

1. Sign up for Supabase and make sure you have access to our Supabase [project](https://supabase.com/dashboard/project/qsnuignbeuiqzmiksjty)

1. Clone this repository and install dependencies

   ```bash
   npm install
   ```

1. Rename `.env.local.example` to `.env.local` and update the following:

   ```
   SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
   ```

   Both `SUPABASE_URL` and `SUPABASE_ANON_KEY` can be found in [the Supabase project's API settings](https://supabase.com/dashboard/project/qsnuignbeuiqzmiksjty/settings/api)

1. You can now run the local development server:
   ```bash
   npm run dev
   ```

The server should now be running on [localhost:5001](http://localhost:5001/).