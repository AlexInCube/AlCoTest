#!/bin/bash
echo "Build And Run AICBot"
docker-compose build --no-cache
docker-compose up --detach --force-recreate
