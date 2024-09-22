docker image pull alexincube/aicotest:latest
docker volume create --name=aicbot-mongo-volume
docker compose stop
docker compose up --detach --no-build --remove-orphans
