# Étape 1 : build
FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copie des fichiers de config et install des dépendances
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copie du code source et build
COPY . .
RUN pnpm run build

# Étape 2 : image finale production
FROM node:22-alpine AS production
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

CMD ["node", "dist/index.js"]

# Étape 3 : image pour développement local (sans tests)
FROM node:22-alpine AS development
ENV NODE_ENV=development
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

CMD ["sh", "-c", "pnpm run build && node dist/index.js"]

# Étape 4 : image pour tests (CI/CD)
FROM node:22-alpine AS test
ENV NODE_ENV=development
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "test"]
