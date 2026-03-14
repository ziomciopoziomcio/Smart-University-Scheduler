up:
	cd infrastructure/docker && docker compose up -d
down:
	cd infrastructure/docker && docker compose down
db-upgrade:
	cd infrastructure/docker && docker compose exec backend alembic upgrade head
lint:
	pre-commit run --all-files
db-format:
	cd infrastructure/docker && docker compose down -v
	cd infrastructure/docker && docker compose up -d postgres
	sleep 3
	cd infrastructure/docker && docker compose up -d backend
	cd infrastructure/docker && docker compose exec backend alembic upgrade head
