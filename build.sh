#!/bin/bash

# Source the environment variables
set -a
source .env
set +a

# Print Docker and docker-compose versions
echo "Docker version:"
docker --version
echo "Docker Compose version:"
docker-compose --version

# Debugging information
echo "Current working directory:"
pwd

echo "Contents of current directory:"
ls -la

echo "Contents of bina-backend directory:"
ls -la ./bina-backend

# Force rebuild of images and start the services with verbose output
echo "Building and starting backend service..."
docker-compose up --build --force-recreate -d --verbose backend

# Additional debugging information
echo "Docker images:"
sudo docker images

echo "Running containers:"
sudo docker ps -a

echo "Logs from backend container:"
sudo docker-compose logs backend