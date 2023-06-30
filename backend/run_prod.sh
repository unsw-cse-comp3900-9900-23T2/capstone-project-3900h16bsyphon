set -a # automatically export all variables
DATABASE_HOST=database
BACKEND_HOST=backend
source .env
set +a # stop exporting variables

./migration up

./actix-demo