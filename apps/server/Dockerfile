FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/web/package.json ./apps/
COPY packages/database/package.json packages/shared/package.json ./packages/
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --config.workspace-concurrency=1

FROM deps AS build
COPY . .
RUN pnpm build

FROM base AS runner
COPY --from=build /workspace/package.json ./
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/packages ./packages
COPY --from=build /workspace/apps/server/dist ./apps/server/dist
EXPOSE 4000
CMD ["node", "apps/server/dist/main"]
