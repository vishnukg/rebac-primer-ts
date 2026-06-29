FROM node:24.18.0-alpine AS dev
WORKDIR /workspace
ENV npm_config_update_notifier=false

FROM dev AS deps
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM deps AS build
COPY . .
RUN npm run build

FROM node:24.18.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S -G app app
USER app
COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/dist ./dist
EXPOSE 4001
CMD ["node", "dist/server/index.js"]
