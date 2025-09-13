# --- Stage 1: Build the React application ---
FROM node:24-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN npm run build

# --- Stage 2: Serve the application with Nginx ---
FROM nginx:1.23-alpine

# Copy the built static files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# When the container starts, nginx will serve the files
# The default nginx config is sufficient for a basic SPA
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
