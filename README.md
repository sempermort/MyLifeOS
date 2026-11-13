# MyLife OS — Starter v1

A pure JavaScript personal development tracker designed for Netlify hosting with Supabase as the online database.

## Stack
- HTML5, CSS3, vanilla JavaScript ES modules
- Supabase Auth + PostgreSQL + Row Level Security
- Chart.js
- Netlify static hosting

## 1. Create the Supabase project
1. Create a project at https://supabase.com/
2. Open **Project Settings → API**.
3. Copy the Project URL and publishable key (or legacy anon key).
4. Open `js/config.js` and replace both placeholders.
5. Open **SQL Editor** in Supabase.
6. Paste and run `sql/schema.sql`.

Do not put the `service_role` secret in browser code. The SQL enables Row Level Security so users can only access their own rows.

## 2. Run locally
Because this project uses JavaScript modules, serve it through a local web server rather than opening `index.html` directly.

With Python already installed:
```bash
python -m http.server 8000
```
Then visit http://localhost:8000.

Or use the VS Code Live Server extension.

## 3. Deploy to Netlify
1. Push this folder to a GitHub repository.
2. In Netlify choose **Add new site → Import an existing project**.
3. Select the repository.
4. Build command: leave blank.
5. Publish directory: `.`.
6. Deploy.

You can also drag the project folder into Netlify Drop for a quick test deployment.

## Current functionality
- Supabase email/password sign-in and registration
- Eight life dimensions
- Daily activity create, read, update and delete
- Search and dimension filtering
- Daily/weekly/monthly self-evaluation records
- Goal setting with life dimensions, deadlines, milestones and completion tracking
- Dashboard activity metrics and a 7-day chart
- Responsive desktop/mobile layout

## Important notes
- Supabase email confirmation may be enabled by default. If enabled, users must confirm their email before signing in.
- This is an initial foundation, not yet the complete product. Dedicated financial/farm/relationship modules, richer analytics, CSV/Excel export, backups and PWA/offline support are planned next.
- Evaluation scores are reflection aids, not measures of spiritual worth. Keep written evidence and reflections alongside numbers.
- If you already ran the initial database setup, rerun `sql/schema.sql` to create the goals and milestones tables and their row-level security policies.
