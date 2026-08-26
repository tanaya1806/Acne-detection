# Clinderma Prototype

This project consists of a React frontend and a Python FastAPI backend for acne detection using the Roboflow API.

## Prerequisites

- Node.js and npm
- Python 3.8+

## How to Run the Project

You will need two separate terminal windows to run both the frontend and backend simultaneously.

### 1. Start the Backend (FastAPI)

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

(Optional but recommended) Create and activate a virtual environment:
```bash
# On Windows
python -m venv venv
venv\Scripts\activate
```

Install the required Python dependencies:
```bash
pip install -r requirements.txt
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```
The backend will run at `http://localhost:8000`.

### 2. Start the Frontend (React + Vite)

Open a new terminal window and make sure you are in the root directory (`d:\CLINDERMA\prototype`).

Install the Node dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend will typically run at `http://localhost:5173` (check the terminal output for the exact URL).

## Configuration

The acne detection model uses the Roboflow API. The API key and Model ID are configured in `backend/app/acne_detector.py`.
