# API

Small Flask app that sits between the UI and MariaDB. Right now it only serves reads so the browse pages can use real centre / stall / menu rows.

- `GET /health`
- `GET /centres`
- `GET /centres/<id>/stalls`
- `GET /stalls/<id>/menu`

Checkout (`POST /orders/pay`) isn’t wired yet.

## Run it

Copy `.env.example` at the repo root to `.env` and set the MariaDB password. Apply `sql/schema/01_core.sql` first (and `sql/schema/test_inserts.sql` if you want a couple of sample rows).

From the repo root:

```bash
pip install -r backend/requirements.txt
python backend/app.py
```

It listens on http://localhost:3000. Point the frontend at that with `VITE_API_BASE_URL` in `frontend/.env`.
