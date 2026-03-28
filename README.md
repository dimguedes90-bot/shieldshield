<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Shield Shield

Shield Shield is a React/Vite MVP for privacy-preserving digital identity flows. The app now supports real authentication with Supabase Auth for email/password sign up and login.

## Run locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create a Supabase project.
3. In Supabase, copy your project URL and anon key.
4. Set the environment variables in `.env.local`:

   ```env
   GEMINI_API_KEY=your_gemini_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. In Supabase Auth settings, make sure your local URL is allowed.
   Example: `http://localhost:5173`
6. Run the app:
   `npm run dev`

## Notes

- The login/register screen uses Supabase Auth with email/password.
- If email confirmation is enabled in Supabase, new users must confirm their email before logging in.
- `.env.local` is ignored by Git and should not be committed.
