# Plan: Manual Google Sheets Sync Button

## What we are building
A "Sync from Google Sheet" button at the top of the admin dashboard that pulls the latest creator revenue data directly from the connected Google Sheet and writes it into the `creator_revenue` table, replacing the current push-only flow with a manual pull option.

## User-visible behaviour
1. A button appears in the admin header next to the existing "Month Comparison" and "View Public Page" actions.
2. Clicking it opens a small status panel or triggers a modal that shows sync progress and a result message (e.g. "Synced X rows for Y creators").
3. The button uses the existing Google Sheet data source, so the same sheet data that currently feeds the Apps Script webhook is the source of truth.
4. After a successful sync, the dashboard, leaderboard, and public creator pages all reflect the new data immediately.

## Technical approach
- **Backend**: Create a new Supabase Edge Function `pull-sheets-sync` that reads the relevant sheet via the Lovable Google Sheets connector, transforms the rows into the `creator_revenue` schema, and upserts them on `(creator_code, month)`.
- **Connector**: Link the workspace Google Sheets connection to the project so the edge function can call `https://connector-gateway.lovable.dev/google_sheets/v4/...` using `LOVABLE_API_KEY` and the connection key.
- **Frontend**: Add a sync button with a loading state in `src/pages/AdminDashboard.tsx` header and call `supabase.functions.invoke('pull-sheets-sync')`. On success, refresh the creator list and revenue totals.
- **Data transformation**: Reuse the same field mapping as the existing webhook (`rd_bookings`, `rd_gna`, `rd_room_revenue`, `hgl_bookings`, `hgl_revenue`, `events_revenue`) and set `synced_at = now()`. Preserve existing `allin_*` fields on each row (do not overwrite them). Auto-create new creator codes in the `creators` table, matching the existing webhook behaviour.
- **Security**: The edge function validates the admin's Supabase JWT before calling the Google Sheets API, so only logged-in admin users can trigger the sync.

## Open questions / requirements from the user
- What is the Google Sheet URL / ID? We need the exact spreadsheet URL to know which sheet to pull from. The connector can only access the sheets the user has granted access to.
- Which sheet/tab name(s) contain the data? The spreadsheet may have one tab (e.g. "Summary" or "Raw") or multiple tabs that need to be combined.
- Does the sheet layout exactly match the existing webhook payload (one row per creator per month, with columns for `rd_bookings`, `rd_gna`, `rd_room_revenue`, `hgl_bookings`, `hgl_revenue`, `events_revenue`)? If not, please share a screenshot or the header row so we can map the columns correctly.

## Files that will change
- `supabase/functions/pull-sheets-sync/index.ts` (new)
- `src/pages/AdminDashboard.tsx` (add button + sync handler)
- `src/pages/AdminSheets.tsx` (optional: refresh last-synced display after sync)
- Project secrets / connector configuration

## Steps
1. User provides the spreadsheet URL and tab name(s) / column layout.
2. Link the Google Sheets connector to the project.
3. Implement the `pull-sheets-sync` edge function.
4. Add the button in the admin dashboard header.
5. Test the sync end-to-end and verify the dashboard totals update.
