FROM oven/bun:latest

WORKDIR /app

# Copy dependency files first (for caching)
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of your code
COPY . .

# Expose the port Hono runs on
EXPOSE 3000

# Start the server
CMD ["bun", "run", "src/index.ts"]