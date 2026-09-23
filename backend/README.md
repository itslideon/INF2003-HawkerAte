# API

Flask app between the UI, MariaDB, and Mongo.

Browse (MariaDB):

- `GET /health`
- `GET /centres`
- `GET /centres/<id>/stalls`
- `GET /stalls/<id>/menu`

Reviews (Mongo):

- `GET /stalls/<id>/reviews`
- `POST /reviews`

Checkout (MariaDB transaction, then a Mongo `payment_events` doc):

- `POST /orders/pay`

Ids in Mongo are strings of the MariaDB ints (`1` → `"1"`).

## Run it

Copy `.env.example` at the repo root to `.env`. Fill in MariaDB and `MONGO_URI` / `MONGO_DB`. Don’t commit `.env`.

Apply `sql/schema/01_core.sql` and `sql/schema/02_fintech.sql` (plus `test_inserts.sql` if you want sample rows).

```bash
pip install -r backend/requirements.txt
python backend/app.py
```

http://localhost:3000 — point the frontend at that with `VITE_API_BASE_URL` in `frontend/.env`.
