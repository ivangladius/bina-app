# Makefile for Binance Trading Bot

# Variables
IMAGE_NAME = binance-trading-bot
CONTAINER_NAME = binance-bot-container
PORT = 8000

# Docker build command
build:
	sudo docker build -t $(IMAGE_NAME) .

# Docker run command with volume mounting
run:
	sudo docker run --rm -p $(PORT):$(PORT) \
		-e BINANCE_TESTNET_API_KEY=${BINANCE_TESTNET_API_KEY} \
		-e BINANCE_TESTNET_SECRET_KEY=${BINANCE_TESTNET_SECRET_KEY} \
		-v ${PWD}:/app \
		--name $(CONTAINER_NAME) \
		$(IMAGE_NAME)

# Stop and remove the container
stop:
	sudo docker stop $(CONTAINER_NAME)
	sudo docker rm $(CONTAINER_NAME)

# Clean up: remove the image
clean:
	sudo docker rmi $(IMAGE_NAME)

# Help command
help:
	@echo "Available commands:"
	@echo "  make build  - Build the Docker image (with sudo)"
	@echo "  make run    - Run the Docker container with volume mounting (with sudo)"
	@echo "  make stop   - Stop and remove the running container (with sudo)"
	@echo "  make clean  - Remove the Docker image (with sudo)"
