#!/bin/sh
docker image pull alexincube/aicotest:latest
docker compose up --detach --force-recreate --no-build --remove-orphans
