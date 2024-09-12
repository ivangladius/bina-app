# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy only the requirements file into the container
COPY requirements.txt .

# Install the required packages
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port that the app runs on
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the application in debug mode
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--debug"]

# Copy the static files into the container, following symlinks