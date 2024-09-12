#!/bin/bash

# Source the environment variables
set -a
source .env
set +a

# Use docker-compose to start the services
sudo -E docker-compose up -d --remove-orphans