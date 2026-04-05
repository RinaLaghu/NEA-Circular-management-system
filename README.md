# NEA-Circular-management-system

This repository now has:

- `frontend/` for the login UI
- `backend/` for the FastAPI service

## FastAPI backend setup

Run these commands from the project root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

If your system uses `py` launcher, replace `python` with `py`.

## API endpoints

- `GET /health`
- `POST /auth/login`

Example request body for login:

```json
{
	"directorate": "A",
	"department": "Information Technology",
	"password": "nea123"
}
```

For this starter scaffold, the demo password is `nea123`.

## API docs

After starting the server:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`