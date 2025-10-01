# Stage 1: Build the app
FROM node:20-bullseye-slim AS build

# Set the working directory
WORKDIR /app

# ENV VITE_API_URL=https://wisecore-backend.1wb6lor29n3q.us-south.codeengine.appdomain.cloud
ENV VITE_API_URL=http://localhost:8000

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Vite app
RUN npm run build

# Stage 2: Serve the app
FROM node:20-bullseye-slim AS serve

# Install a lightweight HTTP server to serve the app
RUN npm install -g serve

# Set the working directory
WORKDIR /app

# Copy the built files from the previous stage
COPY --from=build /app/dist ./dist

# Expose the port that the app will run on
EXPOSE 8080

# Command to run the HTTP server
CMD ["serve", "-s", "dist", "-l", "8080"]