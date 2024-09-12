# Makefile for Bina project

# Variables
DOCKER_COMPOSE = docker-compose

# Default target
.DEFAULT_GOAL := help

# Help target
help:
	@echo "Available commands:"
	@echo "  make up      - Start the project"
	@echo "  make down    - Stop the project"
	@echo "  make build   - Rebuild the project"
	@echo "  make logs    - View logs"
	@echo "  make clean   - Remove all containers and images"

# Start the project
up:
	$(DOCKER_COMPOSE) up -d

# Stop the project
down:
	$(DOCKER_COMPOSE) down

# Rebuild and start the project
build:
	BINANCE_TESTNET_API_KEY=${BINANCE_TESTNET_API_KEY} \
	BINANCE_TESTNET_SECRET_KEY=${BINANCE_TESTNET_SECRET_KEY} \
	BINANCE_API_KEY=${BINANCE_API_KEY} \
	BINANCE_SECRET_KEY=${BINANCE_SECRET_KEY} \
	$(DOCKER_COMPOSE) up -d --build

# View logs
logs:
	$(DOCKER_COMPOSE) logs -f

# Remove all containers and images
clean:
	$(DOCKER_COMPOSE) down --rmi all --volumes --remove-orphans

# Ensure that these commands are not interpreted as file names
.PHONY: help up down build logs clean