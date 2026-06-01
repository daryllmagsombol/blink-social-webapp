FROM node:22-bookworm-slim

WORKDIR /workspace

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

EXPOSE 4000

CMD ["pnpm", "--filter", "@social/server", "start:prod"]