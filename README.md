# NEA-Circular-management-system

Welcome to the NEA Circular Management System! This repository is divided into an interactive frontend built with React/Vite and a robust backend powered by FastAPI.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ recommended) for the frontend
- [Python](https://www.python.org/) (v3.8+ recommended) for the backend

## Project Structure

- `frontend/`: The user interface built with React + Vite.
- `backend/`: The API service built with Python + FastAPI.
- `UI/`: Static HTML/CSS mockups and designs.

## Setup & Run Instructions

### 1. Backend Setup (FastAPI)

Open a terminal and follow these steps to start the API server:

```powershell
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv .venv
# (Use `py -m venv .venv` if your system uses the py launcher)

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1
# (On macOS/Linux: source .venv/bin/activate)

# Install dependencies
pip install -r requirements.txt

# (Optional) Create environment file if an example exists
# copy .env.example .env

# Run the backend development server
uvicorn app.main:app --reload
```
*The backend server will start at `http://127.0.0.1:8000`.*

### 2. Frontend Setup (React/Vite)

Open a **new** terminal window and follow these steps to start the UI:

```powershell
# Navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend will start on an address like `http://localhost:5173`.*

## API Information

### Development Endpoints

- `GET /health` - Health check
- `POST /auth/login` - Authenticate users

**Example Login Request:**

```json
{
	"directorate": "A",
	"department": "Information Technology",
	"password": "nea123"
}
```
*(Note: For this starter scaffold, the demo password is `nea123`)*

### API Documentation (Interactive)

Once the backend is running, explore the API endpoints easily via built-in tools:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)