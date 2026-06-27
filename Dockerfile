FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
RUN corepack prepare pnpm@11.9.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

COPY . .

ENV DATABASE_URL="file:./dev.db"
RUN pnpm exec prisma generate
RUN pnpm build

RUN mkdir -p /data

EXPOSE 3000
EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start"]