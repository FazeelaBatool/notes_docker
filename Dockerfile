# Use an official Node.js 20 runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the app code
COPY . .

# Expose port the app runs on
EXPOSE 8080

# Start the app
CMD ["node", "app.js"]
