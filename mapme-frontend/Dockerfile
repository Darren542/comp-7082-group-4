# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's code
COPY . .

# Build the app for production
RUN npm run build

# Expose the port Vite will run on
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev"]
