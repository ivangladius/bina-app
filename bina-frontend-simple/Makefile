# Makefile

# Variables
IMAGE_NAME = live-server-image
CONTAINER_NAME = live-server-container
HOST_PORT = 8080
CONTAINER_PORT = 8080

# Build the Docker image
build:
	docker build -t $(IMAGE_NAME) .

# Run the Docker container
run:
	docker run -d --name $(CONTAINER_NAME) \
		-p $(HOST_PORT):$(CONTAINER_PORT) \
		-v $(PWD):/app \
		$(IMAGE_NAME)

# Stop and remove the container
stop:
	docker stop $(CONTAINER_NAME)
	docker rm $(CONTAINER_NAME)

# Build and run the container
up: build run

# Stop the container and remove the image
down: stop
	docker rmi $(IMAGE_NAME)

# Show container logs
logs:
	docker logs -f $(CONTAINER_NAME)

# Enter the container shell
shell:
	docker exec -it $(CONTAINER_NAME) /bin/sh

.PHONY: build run stop up down logs shell