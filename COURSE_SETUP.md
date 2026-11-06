# Funnybone semester project starter — Fall 2026

This archive contains the Funnybone source from commit
`ed536ef042a503c8ac28a96b57215b621f8f2462`.
The repository's `.env`, `.env.production`, and `.env.staging` files have been
excluded from the course download. A placeholder `.env.example` is included.

## Local setup

1. Install Node.js 24.x, as specified by the repository's README and package.json.
2. Create a new Supabase project that you control.
3. Follow the restore instructions distributed with the anonymized data ZIP to
   import the compatible database schema and anonymized records.
4. From the extracted `funnybone` directory, run:

   ```bash
   npm ci
   cp .env.example .env.local
   ```

5. Edit `.env.local` to use your new project's URL and public anon key. Use the
   signed-in user's session for authenticated application access.
6. Complete the course's authentication configuration for your new Supabase
   project. If the supported login flow uses Google OAuth, configure that
   provider and the local redirect URLs using your project's settings.
7. Start the front end:

   ```bash
   npm run dev
   ```

8. Open `http://localhost:3000`. Confirm that the app displays the imported data
   and that the workflow you plan to improve works before making changes.

## Caption API dependency

The source uses `NEXT_PUBLIC_API_BASE_URL` for image uploads and caption
generation. That API is a separate service and is not included in this front-end
archive. Use the course-approved setup for that service if your workflow depends
on it. A restored Supabase database alone does not provide the caption API.

## Project deadline

The final video is due December 6, 2026, at 11:59 p.m. Eastern Time.
Late submissions are not accepted.
