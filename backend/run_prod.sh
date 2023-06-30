#!/bin/sh

set -a # automatically export all variables
source .env
DATABASE_HOST=database
BACKEND_HOST=backend
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DATABASE_HOST}/${POSTGRES_DB}
set +a # stop exporting variables

./migration up

./actix-demo