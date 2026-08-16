# LeadPilot

## Lokalne uruchomienie w Dockerze

Wymagania:

- Docker Desktop,
- skonfigurowany plik `backend/.env` na podstawie `.env.example`.

Uruchom API, worker Celery, PostgreSQL i Redis:

```bash
docker compose up --build -d
```

API jest dostępne pod `http://localhost:8000`, a healthcheck pod:

```text
http://localhost:8000/health/
```

Przydatne polecenia:

```bash
docker compose ps
docker compose logs -f api worker
docker compose exec api python manage.py createsuperuser
docker compose down
```

`docker compose down` zachowuje dane PostgreSQL. Aby świadomie usunąć także
lokalną bazę, użyj `docker compose down --volumes`.
