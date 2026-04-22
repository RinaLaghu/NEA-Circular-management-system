# NEA-Circular-management-system

NEA Circular Management System is currently organized as a React + Vite frontend and a FastAPI backend.

This README reflects the current implementation state and documents what each major folder and file is responsible for.

## Current Tech Stack

### Frontend
- React 19
- React Router (SPA routing)
- Vite
- ESLint (flat config)
- Lucide React icons
- CSS stylesheets (no Tailwind or CSS framework)

### Backend
- FastAPI
- Uvicorn
- Pydantic + pydantic-settings
- SQLAlchemy (SQLite-ready setup)
- python-dotenv
- Alembic (installed in dependencies; migration workflow not fully wired yet)

## Prerequisites

- Node.js 18+ recommended
- Python 3.10+ recommended

## Setup And Run

### 1) Backend

```powershell
cd backend

# create virtual environment (if needed)
python -m venv .venv

# activate
.\.venv\Scripts\Activate.ps1

# install dependencies
python -m pip install -r requirements.txt

# run API server
uvicorn app.main:app --reload
```

Backend default URL: `http://127.0.0.1:8000`

### 2) Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## API Endpoints (Current)

- `GET /health`
	- Purpose: service health and current environment.
	- Response shape:
		- `status`: string
		- `environment`: string

- `POST /auth/login`
	- Purpose: demo login validation.
	- Current behavior:
		- accepts directorate, department, password
		- validates against demo password `nea123`
		- returns a demo token when valid

Example request body:

```json
{
	"directorate": "A",
	"department": "Information Technology",
	"password": "nea123"
}
```

Interactive docs:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Backend Directory Reference (Detailed)

```text
backend/
	.env
	requirements.txt
	app/
		__init__.py
		config.py
		main.py
		schemas.py
		api/
			__init__.py
			routers/
				__init__.py
				auth.py
		core/
			__init__.py
			settings.py
		db/
			__init__.py
			database.py
		deps/
			__init__.py
			db.py
		models/
			__init__.py
			base.py
```

### backend/.env
- Environment values loaded by settings.
- Currently includes:
	- `APP_NAME`
	- `APP_ENV`
	- `ALLOWED_ORIGINS`

### backend/requirements.txt
- Python dependency list used to install backend packages.

### backend/app/__init__.py
- Marks `app` as a Python package.

### backend/app/config.py
- Compatibility shim.
- Re-exports `Settings` and `get_settings` from `app.core.settings`.
- Keeps older import paths working while code migrates to the new location.

### backend/app/main.py
- FastAPI application entrypoint.
- Responsibilities:
	- creates `FastAPI` app instance
	- loads settings
	- configures CORS middleware using allowed origins from settings
	- defines `GET /health`
	- registers auth router (`/auth`)

### backend/app/schemas.py
- Pydantic models for auth API.
- Contains:
	- `LoginRequest` (directorate, department, password validation)
	- `LoginResponse` (success/message/token)

### backend/app/api/__init__.py
- Marks `api` as a Python package.

### backend/app/api/routers/__init__.py
- Marks `routers` as a Python package.

### backend/app/api/routers/auth.py
- Auth route definitions.
- Currently includes `POST /auth/login` with demo credential check.

### backend/app/core/__init__.py
- Marks `core` as a Python package.

### backend/app/core/settings.py
- Central settings source using `pydantic-settings`.
- Responsibilities:
	- loads values from `.env`
	- defines defaults (`app_name`, `app_env`, `database_url`, etc.)
	- computes `allowed_origins` list from comma-separated env value
	- exposes cached `get_settings()`

### backend/app/db/__init__.py
- Marks `db` as a Python package.

### backend/app/db/database.py
- Database connectivity baseline.
- Responsibilities:
	- creates SQLAlchemy engine from `database_url`
	- applies SQLite `check_same_thread=False` when needed
	- defines `SessionLocal` session factory

### backend/app/deps/__init__.py
- Marks `deps` as a Python package.

### backend/app/deps/db.py
- FastAPI dependency utilities for DB access.
- Contains `get_db()` generator:
	- opens a DB session
	- yields it to route handlers
	- closes session after request lifecycle

### backend/app/models/__init__.py
- Marks `models` as a Python package.

### backend/app/models/base.py
- Defines SQLAlchemy declarative base class.
- Used as parent for future ORM models.

## Frontend Directory Reference (Detailed)

```text
frontend/
	.gitignore
	eslint.config.js
	index.html
	package-lock.json
	package.json
	README.md
	vite.config.js
	public/
		favicon.svg
		icons.svg
		logo.png
	src/
		App.jsx
		main.jsx
		assets/
			a.png
			b.png
			c.png
			Container.png
			d.png
			e.png
			f.png
			hero.png
			Icon.png
			icon2.png
			icon3.png
			logo.png
			logo1.png
			Overlay.png
			react.svg
			vite.svg
		components/
			circular/
				CircularTable.jsx
			layout/
				PageLayout.jsx
				Sidebar.jsx
				Topbar.jsx
			ui/
				CircularListCard.jsx
				StatCard.jsx
		pages/
			auth/
				login.jsx
			circular/
				ArchivePage.jsx
				CircularPreviewPage.jsx
				NewCircularPage.jsx
			dashboard/
				CircularDashboard.jsx
			drafts/
				DraftsPage.jsx
			mail/
				InboxPage.jsx
				SentPage.jsx
		styles/
			circular-dashboard.css
			index.css
			login.css
```

### frontend/.gitignore
- Ignore rules for node build artifacts and local environment files.

### frontend/eslint.config.js
- ESLint flat configuration.
- Enables JS + React rules and ignores `dist/`.

### frontend/index.html
- Vite HTML host file.
- Contains root element (`#root`) and loads `src/main.jsx`.

### frontend/package.json
- Frontend scripts and dependencies.
- Main scripts:
	- `npm run dev`
	- `npm run build`
	- `npm run lint`
	- `npm run preview`

### frontend/package-lock.json
- Exact resolved dependency versions for reproducible installs.

### frontend/README.md
- Default Vite template README.

### frontend/vite.config.js
- Vite configuration.
- Adds React plugin.
- Defines path alias `@` -> `src`.

### frontend/public/
- Static assets served directly by Vite dev server/build.
- Files:
	- `favicon.svg`: browser tab icon
	- `icons.svg`: static icon sprite asset
	- `logo.png`: NEA logo image used by pages that load from root `/logo.png`

### frontend/src/main.jsx
- Frontend bootstrap file.
- Mounts React app into `#root`.
- Wraps app with `BrowserRouter`.
- Imports main dashboard stylesheet.

### frontend/src/App.jsx
- Central route map for SPA navigation.
- Active routes:
	- `/login`
	- `/inbox`
	- `/sent`
	- `/drafts`
	- `/archive`
	- `/new-circular`
- Root `/` redirects to `/inbox`.

### frontend/src/assets/
- Local image assets for UI experiments and visual elements.
- Includes logo variants and decorative UI graphics.

#### Asset file notes
- `logo1.png`: currently used in sidebar branding.
- `logo.png`: available local logo variant.
- `react.svg`, `vite.svg`: template assets from initial Vite scaffold.
- other `*.png` files (`a.png`, `b.png`, `Container.png`, `Overlay.png`, etc.): design assets available for page styling or future components.

### frontend/src/components/
- Reusable UI building blocks.

#### frontend/src/components/circular/CircularTable.jsx
- Reusable table component for circular listings.
- Receives circular data via props and renders rows with priority styling.

#### frontend/src/components/layout/PageLayout.jsx
- Shared page shell.
- Combines sidebar + topbar + content container for authenticated pages.

#### frontend/src/components/layout/Sidebar.jsx
- Left navigation panel.
- Contains app branding, quick action button, route navigation links, and footer actions.

#### frontend/src/components/layout/Topbar.jsx
- Header area with title, search box, help/notification/profile action icons.

#### frontend/src/components/ui/CircularListCard.jsx
- Reusable card row component for sent/draft/archive list style views.

#### frontend/src/components/ui/StatCard.jsx
- Reusable stat summary card used in dashboard/inbox sections.

### frontend/src/pages/
- Route-level page components.

#### frontend/src/pages/auth/login.jsx
- Login UI page.
- Features:
	- directorate selection
	- dynamic department options by directorate
	- password field and static form UI
- Current status:
	- frontend API integration is not connected yet (UI-only validation flow).

#### frontend/src/pages/mail/InboxPage.jsx
- Inbox dashboard page using `PageLayout`.
- Shows summary stat cards + latest circulars table with mock data.

#### frontend/src/pages/mail/SentPage.jsx
- Sent circular list page with static card data.
- Includes quick action button for creating a new circular.

#### frontend/src/pages/drafts/DraftsPage.jsx
- Draft circular list page.
- Uses `useNavigate` for new-circular navigation.

#### frontend/src/pages/circular/ArchivePage.jsx
- Archived circular page.
- Includes search field and archive list cards.

#### frontend/src/pages/circular/NewCircularPage.jsx
- Circular compose workflow page.
- Features:
	- title/category/priority inputs
	- internal and external recipient selection
	- body editor with word count
	- file attachment drag/drop and type validation
	- preview handoff to preview page

#### frontend/src/pages/circular/CircularPreviewPage.jsx
- Printable circular preview view.
- Renders composed circular data in a formal notice format.
- Supports back-to-edit, print, and confirm/send actions.

#### frontend/src/pages/dashboard/CircularDashboard.jsx
- Alternate dashboard/inbox layout page with similar summary + table visuals.
- Present in codebase but not currently mapped in active routes.

### frontend/src/styles/

#### frontend/src/styles/circular-dashboard.css
- Main stylesheet for app shell and dashboard-like pages.
- Styles sidebar, topbar, stats, table, compose and preview related classes.

#### frontend/src/styles/login.css
- Login page specific stylesheet.
- Styles login card, controls, warning text, and footer layout.

#### frontend/src/styles/index.css
- Additional global style definitions (legacy/global CSS baseline).

## Notes On Current State

- Backend has foundational app/settings/router/db/session structure in place.
- Backend auth route is still demo logic (hardcoded credential check).
- Frontend pages are mostly UI-complete and currently use mock data.
- Frontend-to-backend auth and circular CRUD APIs are not fully integrated yet.

## Suggested Next Milestones

1. Connect `login.jsx` to `POST /auth/login` and store token/session state.
2. Create circular model + migration + CRUD API endpoints in backend.
3. Replace frontend mock circular arrays with backend API calls.
4. Add tests:
	 - backend API tests (health, auth, DB)
	 - frontend component/page tests for key flows