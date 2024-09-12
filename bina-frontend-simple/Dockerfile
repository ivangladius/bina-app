# Use an official Node runtime as the base image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install live-server
RUN npm install -g live-server

# Copy the current directory contents into the container at /app
COPY . .

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Run live-server when the container launches
CMD ["live-server", "--port=8080", "--host=0.0.0.0", "--no-browser"]
