#/bin/bash

docker compose down
docker compose up -d

cd backend
sea-orm-cli generate entity --with-serde both -o src/entities
