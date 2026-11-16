# Caption generation jobs

All caption generation entry points (new uploads, image caption pages, library images and Crack Again) use the client-side `generateCaptions` helper. It now:

1. Submits `POST /pipeline/generate-captions` with `{ imageId }` and an `Idempotency-Key`.
2. Polls `GET /pipeline/caption-job/<jobId>` every three seconds until the job is terminal.
3. Loads only the returned caption IDs from Supabase, using the same signed-in user's JWT, and returns the `Caption[]` expected by the UI.

No HTTP request waits for the prompt chain to complete. Requests time out after 30 seconds; the browser may wait up to one hour overall. Status requests retry network errors, rate limits and server errors. A 401 refreshes the user's token once. Partial completion displays successful captions and a notice; a failed job is treated as failure even when the status request returns HTTP 200.

The loading screen shows saved step progress. **Continue browsing** transfers the active operation to the root layout's caption generation provider and closes the overlay without navigating away. The current page stays available to create more captions or browse elsewhere. Uploads, submission, polling and caption loading continue across client-side navigation without submitting another job. The detached operation stops updating the original page, so its completion cannot interrupt a new generation. On completion, a notification slides in at the bottom right. **View captions** opens `/caption-job/<jobId>` and dismisses that notification. The link uses the API's persisted job ID, not the browser task ID. The server page retrieves the job using the signed-in user's JWT, then loads its saved caption IDs and image through that user's Supabase client. Reopening or refreshing loads the full set of results in job order, without submitting another generation or mixing in popular captions or earlier jobs. Pending and failed jobs show their status, inaccessible jobs return not found, and partial completions show the successful captions. Older image links with caption ID query parameters still work; cached-caption operations that never submit a job retain that link format. Notifications remain across navigation until their link or X button is clicked, do not block browsing, and stack when multiple jobs finish. Partial completion and background failures have distinct messages. The provider is scoped to the signed-in user and cancels outstanding work when it unmounts.

Ordinary navigation or cancellation still aborts foreground operations. Accepted jobs continue on the backend. The pending job reference and idempotency key are saved in session storage (with an in-memory fallback), scoped by API environment, user and image. Selecting the same image or choosing **Get captions** resumes that job, including after a reload in the same tab. Successful reads and terminal failures clear the reference so **Crack Again** starts fresh work. No tokens or caption content are persisted by this mechanism. Background notifications are in-app for the current page session; reloading or closing the tab ends the browser tracker.

The app uses the existing public Supabase key and the logged-in user's JWT, with normal RLS. No database migration or service-role key is needed. Deploy against the API version that supports caption jobs.

While background work is running, each job has its own compact progress notification at the bottom right, with the source image thumbnail, spinner, progress bar, and X button. Uploads use a local preview immediately; URL uploads, library images, and Crack Again use the selected image URL. Successful completion notifications show the same source image thumbnail, including partial completions. A missing or unreadable preview shows an image placeholder. The progress notification remains across navigation until dismissed or the job finishes. Its X hides only that progress notification: processing continues, later polling does not reopen it, and the completion or failure notification still appears. Local preview URLs remain available until the completion notification is dismissed through its X or **View captions** link. Previews without a completion notification are released when the task finishes or is canceled, and all remaining previews are released when the provider unmounts. The spinner, bar, and slide-in animations stay enabled regardless of the system's reduced-motion preference.

Run `npm test` for contract, retry, resume, cancellation, token refresh, background handoff and notification lifecycle coverage, and `npm run build` for the Next.js production build. Tests use Node 24's built-in test runner and TypeScript stripping; no additional test dependencies are required.

The upload page resets its photo chooser when **Continue browsing** is clicked, whether the image is still uploading or captions are already processing. The file input remains enabled and clears its selection after handing off the file, allowing another upload of either the same photo or a different one. Background work retains its own image and cannot overwrite the new selection.

Browser verification with simulated jobs covered closing the overlay while staying on the same page, uploading the same photo again during an existing upload, choosing a different photo during caption processing, and navigating away afterward. Completing an earlier job leaves a newer foreground operation intact, and all detached jobs produce independent notifications. Earlier simulated API checks covered continuing during upload and polling, JWT-authenticated caption reads, completion notices persisting across routes, X dismissal, partial completion without a blocking toast, and mobile layout. Animation checks confirm motion remains enabled even when the browser reports a reduced-motion preference. An authenticated smoke test against staging should accompany deployment.

## Nudges

A nudge is optional context for a new file or URL upload. It is stored in `images.additional_context`, which humor flavor prompts read through `${imageAdditionalContext}`. The flow in `src/utils/nudge-upload-flow.ts` runs in this order: check availability, upload the image, save the nudge, then generate. A blank nudge skips the first and third steps, so it adds no requests. If the save fails, generation does not start and the user sees why.

Saving is off unless the server-only variable `ENABLE_NUDGE_PERSISTENCE` is exactly `true`. While it is off, a typed nudge blocks the upload with a clear message, and `updateImageNudgeAction` refuses to write. Keep it off for real users until `llm_model_responses` is reviewed: the caption API logs full prompts there, and anonymous clients can read that table in the restored database.

The saved nudge stays on the image, so **Crack Again** reuses it. Shared images never take a nudge. On `/new`, **Crack Again** can change it through the refinement panel below. The image page and My Images keep their direct **Crack Again**, which reuses the saved context unchanged.

Tests named `[mock]` stub Supabase and the caption API. `scripts/mock-caption-api.mjs` is a local stand-in for manual checks against real RLS, not the course API. It only captions images that the running process created for the signed-in user: each must be in its in-memory list, end in the run's `#mock-caption-api=<run id>` URL marker, and still be owned, unshared and unpublished. Other images get a 403, and restarting it refuses earlier mock images. Uploaded files stay in its memory only, so their previews stop working after a restart. Its captions have `metadata.source = 'mock-caption-api'` and no `profile_id`, which hides the Post button. They are not private, because the restored database has no RLS on `captions`, so use made-up nudges only.

## Choosing an image before generating

On `/new`, the file picker, drag-and-drop and **Enter Link** only choose an image. The page shows a preview (a browser object URL for local files, the link itself for URLs) and makes no request until **Generate Captions** is clicked. The nudge can be written or changed while viewing the preview, and its value at the moment of the click is the one validated and saved. Upload, nudge save and generation then run in the same order as before.

Replacing or removing the image keeps the nudge. Each local preview URL is revoked when the image is replaced, removed, generated or the page unmounts. A failed generation keeps the image selected so the user can retry. A click guard set synchronously on click prevents a second generation from starting, and cancelling the first, before the button re-renders as disabled. **Continue browsing** releases the guard so another image can be generated while the first runs in the background.


## Refining context with Crack Again (`/new` only)

On the `/new` results, **Crack Again** opens a panel instead of generating immediately. It loads the image's saved context with `getImageContextAction`, then offers:

- **Keep existing context**: generate again with no change.
- **Add more context**: the saved context, a newline, then the addition.
- **Replace context**: new text in place of the saved context. Blank text is refused; use Clear.
- **Clear context**: an explicit write of `null`. This is different from leaving the first nudge blank, which writes nothing.

The panel shows the saved context, the exact context for this generation and its length out of 280. The limit and the `${` ban apply to that combined text, both in the panel and again on the server. **Cancel** only discards the panel; nothing is written until the user submits. The submit button is disabled while the context loads, while saving, while any generation runs and while the caption API reports an active job for the image. A click guard set synchronously stops rapid clicks. New captions are added before the earlier ones, which are never removed. A failed save or generation leaves them on screen.

### Server side

`updateImageContextAction(imageId, { mode, text, expected })` in `src/app/actions/images/image-context-action.ts` uses the signed-in user's JWT, never a service-role key. It:

1. Requires `ENABLE_NUDGE_PERSISTENCE=true` and a signed-in, non-anonymous user.
2. Reads the row filtered by `id`, `profile_id = user` and `is_common_use IS NOT TRUE`, so bangers, imported shared images and other users' images are never read or changed.
3. Refuses with a conflict if the saved context no longer matches what the panel showed (`expected`), and returns the current value so the panel refreshes.
4. Recomputes the combined context from the database value and validates it.
5. Asks the caption API (`GET /pipeline/image-generation-state/<imageId>`, with the user's JWT) whether it runs jobs from a context snapshot and whether a job for this image is active. If the API lacks the route, is unreachable or reports an active job, nothing is written.
6. Writes with a compare-and-set (`additional_context` must still equal the value read in step 2). Zero updated rows is reported as a conflict. Keep, and a replace with identical text, write nothing.

It returns the exact saved context. The browser then submits `{ imageId, additionalContext }` with a new request ID, which is also the `Idempotency-Key`. The pending-job reference is stored per request, so retrying the same request resumes its job, and a new refinement never resumes an older one. The context text itself is not stored in session storage. If the save succeeds but submission fails, the panel shows the newly saved context, switches to Keep and offers **Retry**, which reuses the same request ID and context and does not save again. Changing the choice discards that retry and starts a new request. A `409` from the API (`generation_in_progress`, `idempotency_conflict` or `context_mismatch`) is shown as a clear message and is not retried automatically.

### With the unmodified Nonchalant API, refinement stays off

Nonchalant has no `image-generation-state` route, so the panel only offers **Keep existing context** and explains why, and the server action refuses every change. Keep then submits `{ imageId }` exactly as before. The reasons:

- Nonchalant reads `images.additional_context` at every pipeline step (`make-pipeline-step-request.ts`), so a change during a job would reach that job's later steps.
- Its request normalizer drops unknown fields, so an `additionalContext` in the body is ignored.
- It does not refuse a second job for an image that already has one running.
- It caches `celebrity_recognition` and `image_description` on the image row. Flavor 101's first step uses the cached celebrity result, so a refined context cannot change that step after the first run.

The mock (`scripts/mock-caption-api.mjs`) implements the contract below, and the tests run against it. Passing mock tests do not mean the real backend has been fixed.

### Nonchalant changes required before enabling it (not implemented)

1. **Immutable context snapshots.** Accept an optional `additionalContext: string | null` in the generate-captions body, validated server-side (trimmed, 280 characters or fewer, no `${`). Include it in the normalized request so the existing idempotency check returns `409` when the same key arrives with a different context. Store it on the job when it is created, and have every step use the job's copy instead of re-reading the image row. Requests without the field keep today's behavior.
2. **Save first, then submit.** Refuse with `409 context_mismatch` when the snapshot differs from the saved `images.additional_context` at submission, so the context shown in the app is always the one used.
3. **One active job per user and image, enforced atomically (option 3b, preferred).** Inside `submit_caption_generation_job`, take a transaction-scoped advisory lock on the image ID, or add a partial unique index on active jobs, and return `409 generation_in_progress` when one exists. This is a database migration and needs review before it is applied. A check in application code alone would leave a race.
4. **Context-dependent caching.** Do not reuse the cached `celebrity_recognition` or `image_description` for steps whose prompts use `${imageAdditionalContext}`, or key the cache by a hash of the snapshot.
5. **Capability route.** Add `GET /pipeline/image-generation-state/<imageId>`, authenticated with the user's JWT and limited to that user's own unshared images, returning `{ "supportsContextSnapshots": true, "activeJob": <boolean> }`. Funnybone enables refinement only when this route answers. Ship it last, after 1 to 4.
6. **RLS review.** The job functions are executable by anon and authenticated in the restored dump, but the migration meant them to be service-role only. Review this before relying on them.

### Mock settings for manual testing

- `MOCK_CAPTION_DELAY_MS=8000` keeps each job running for 8 seconds, so the active-job checks can be seen.
- `MOCK_CAPTION_FAIL_SUBMITS=3` refuses the next three submissions with `503`. The browser retries a submission three times, so this makes one click fail and the following **Retry** succeed.

The mock still captions only images it created for the signed-in user in the current run, refuses shared and other users' images, and never posts captions.

## Running against the real pipeline locally

`../nonchalant-local` is a sanitized, local-only copy of Nonchalant: an in-process worker, a private
Supabase Storage bucket and your own development project and provider keys. It snapshots the context
into every job, refuses a second active job per image, and keeps context-dependent steps out of the
shared image caches. It advertises this through `GET /pipeline/image-generation-state/<id>`, so
contextual Crack Again works with it just as with the mock. The unmodified course API still gets
**Keep existing context** only. See `../nonchalant-local/README.md`.

Point Funnybone at it with `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4020` in `.env.local`.
Nonchalant nests error codes under `data.code`; the job client reads both that and the mock's
top-level `code`. A local API with paid calls disabled answers `503 paid_calls_disabled`, which is
shown and not retried.

## Banger pages when generation is unavailable

`/image/<id>/captions` always shows every caption the signed-in user can see. It only asks the
caption API for more when fewer than 10 are visible and generation can work
(`src/utils/caption-generation-availability.ts`):

- Without `NEXT_PUBLIC_API_BASE_URL` (the Vercel deployment) it never asks. Bangers show their saved
  captions silently, and a banger or private image with none shows "No captions for this image yet".
- If the backend refuses shared images (the local Nonchalant API only captions images in its own
  storage), it is asked once; every other banger in that tab session then shows saved captions
  without a request.
- An unreachable, erroring or rate-limited backend, or one with paid calls turned off, is paused for
  five minutes for every image. An image the backend refuses is not requested again this session.
  An image whose job failed is not retried automatically, but **Try again** retries it.
- Sign-in problems and "already being generated" are explained but do not block later attempts.

Failures never replace or clear captions: the page shows a short note under the carousel instead
of an error. Crack Again pages through the remaining saved captions first. The state is kept in
session storage per API URL, with an in-memory fallback.
