# Use a high-performance Python/Node base
FROM nikolaik/python-nodejs:python3.10-nodejs18

# Install the Industrial Tools (FFmpeg)
RUN apt-get update && apt-get install -y ffmpeg

# Set the Workspace Directory
WORKDIR /app

# Copy the Logic
COPY package*.json ./
RUN npm install
COPY . .

# Build the frontend
RUN npm run build

# Set Environment Variables for the Forge
ENV PORT=8080
ENV NODE_ENV=production

# Execute the Engine
EXPOSE 8080
CMD ["npm", "start"]
