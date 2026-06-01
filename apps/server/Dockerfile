FROM node:22-bookworm-slim
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace

COPY . .

RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store --config.workspace-concurrency=3

RUN pnpm build

EXPOSE 4000
CMD ["node", "apps/server/dist/main"]
