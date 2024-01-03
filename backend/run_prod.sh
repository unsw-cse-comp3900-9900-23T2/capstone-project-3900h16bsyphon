#!/bin/sh

echo starting backend
set -a # automatically export all variables
. ./.env
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DATABASE_HOST}/${POSTGRES_DB}
set +a # stop exporting variables
echo doing migration
./migration up
echo migration done
./actix-demo
echo server exited
