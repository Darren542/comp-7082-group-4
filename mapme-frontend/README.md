# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
# MapMe Frontend

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
   change the env.example to .env

  Create account to get a Cesium Token 
  (Add the key with no quotes as there may be an issue)

  Add cesium token to .env

   Both `SUPABASE_URL` and `SUPABASE_ANON_KEY` can be found in [the Supabase project's API settings](https://supabase.com/dashboard/project/qsnuignbeuiqzmiksjty/settings/api)

1. You can now run the local development server:
   ```bash
   npm run dev
   ```

The server should now be running on [localhost:3000](http://localhost:3000/).




