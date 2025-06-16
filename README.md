# Live Temperature Monitor

## Overview

This repository contains a full-stack real-time temperature monitoring application:

- **Backend**: Go (Gin) server exposing a REST endpoint and a WebSocket stream.
- **Frontend**: React + Vite app with a live-updating chart, controls, and a sidebar.
- **Dockerized**: Separate Dockerfiles for backend and frontend, orchestrated via Docker Compose.

## Features

- **REST** `/temperature` returns a JSON temperature reading.
- **WebSocket** `/ws?period=<ms>` streams live temperature at the specified interval.
- Frontend chart with **Start/Stop**, **Clear**, and **configurable interval**.
- Sidebar showing raw readings with millisecond timestamps.

## Prerequisites

- Go 1.18+
- Node.js 14+ & npm
- Docker & Docker Compose (optional)

## Environment Variables

- **Backend** (`backend/.env`):

  ```dotenv
  PORT=8080
  FRONTEND_ORIGIN=http://localhost:5173
  ```

- **Frontend** (`frontend/.env`):

  ```dotenv
  VITE_WS_BASE_URL=ws://localhost:8080
  ```

## Installation & Usage

### 💻 Local (without Docker)

1. **Clone** the repo:

   ```bash
   git clone https://github.com/ah-naf/live-temp-monitor.git
   cd live-temp-monitor
   ```

2. **Backend**:

   ```bash
   cd backend
   cp .env.example .env       # copy and customize PORT, FRONTEND_ORIGIN
   go mod download
   go run main.go
   ```

3. **Frontend**:

   ```bash
   cd ../frontend
   cp .env.example .env       # copy and customize VITE_WS_BASE_URL
   npm install
   npm run dev
   ```

4. Open your browser at **[http://localhost:5173](http://localhost:5173)**.

### 🐳 With Docker

1. **Copy** or create `.env` files in both `backend/` and `frontend/` if needed.
2. From the **project root**:

   ```bash
   docker-compose up --build
   ```

3. Access:

   - Backend API: `http://localhost:8080/temperature`
   - WebSocket: `ws://localhost:8080/ws?period=<ms>`
   - Frontend UI: `http://localhost:5173`

## Testing

### REST Endpoint

```bash
curl http://localhost:8080/temperature
```

### WebSocket Stream

```bash
npm install -g wscat
wscat -c ws://localhost:8080/ws?period=1000
```

### Rate Limit Test

```bash
./test/rate_test.sh
```

### Load Test (k6)

```bash
npm install -g k6
k6 run test/load_test.js
```
