# syntax = docker/dockerfile:1

# Adjust BUN_VERSION as desired
ARG BUN_VERSION=0.6.14
FROM oven/bun:${BUN_VERSION} as base

LABEL fly_launch_runtime="Bun"

# Bun app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV DB_USER=postgres.yysbfaaovamrkpysevjx
ENV DB_PW=W4w4sx2qIu72Nc1p
ENV DB_HOST=aws-0-us-east-1.pooler.supabase.com
ENV DB_PORT=6543
ENV DB_NAME=postgres
ENV DB_URL="postgresql://postgres.yysbfaaovamrkpysevjx:-rf#UkK.xVQ6Ej6@aws-0-us-east-1.pooler.supabase.com:6543/postgres"




# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential

# Install node modules
COPY --link bun.lockb package.json ./
RUN bun install --ci

# Copy application code
COPY --link . .


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "bun", "run", "start" ]
