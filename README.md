# STDev Homepage

[![CI](https://github.com/stdev-kr/stdev/actions/workflows/ci.yml/badge.svg)](https://github.com/stdev-kr/stdev/actions/workflows/ci.yml)
[![CD](https://github.com/stdev-kr/stdev/actions/workflows/cd.yml/badge.svg)](https://github.com/stdev-kr/stdev/actions/workflows/cd.yml)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## How to run for development

`.env.example` 파일을 참고하여 `.env` 파일을 작성합니다.

```bash
pnpm install
```

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)로 이동합니다.

## How to deploy

Github 레포지토리 설정에서 `Actions secrets and variables` 페이지로 이동한 후 `Repository secrets`에 아래 값을 입력합니다.

- NEXT_PUBLIC_CHANNEL_PLUGIN_KEY=example
- NEXT_PUBLIC_GTM_ID=GTM-example
- NEXT_PUBLIC_GA_ID=G-example
- DATABASE_URL=postgres://user:password@url:port/schema
- BETTER_AUTH_SECRET=example
- BETTER_AUTH_URL=https://www.stdev.kr
- GOOGLE_CLIENT_ID=example.apps.googleusercontent.com
- GOOGLE_CLIENT_SECRET=example

서버에서 `Docker Compose` 환경을 설정한 후, `docker-compose.yml` 을 아래와 같이 작성합니다.

```yml
services:
  stdev:
    container_name: stdev
    image: ghcr.io/stdev-kr/stdev:main
    pull_policy: always
    expose:
      - 1000
    restart: always
    environment:
      DATABASE_URL: postgres://user:password@url:port/schema
      DATABASE_SSL_REJECT_UNAUTHORIZED: 'false'
      BETTER_AUTH_SECRET: example
      BETTER_AUTH_URL: https://www.stdev.kr
      GOOGLE_CLIENT_ID: example.apps.googleusercontent.com
      GOOGLE_CLIENT_SECRET: example
      AWS_REGION: ap-northeast-2
      AWS_ACCESS_KEY: example
      AWS_SECRET_KEY: example
      PAYLOAD_S3_TARGET_BUCKET: stdev-kr
```

컨테이너를 올리기 전에 Prisma 스키마 마이그레이션을 먼저 적용합니다.

```bash
pnpm db:migrate:deploy
```

그 다음 아래 명령을 실행합니다.

```bash
docker compose up -d
```

Port `1000` 번에 Reverse Proxy를 붙입니다.

## CMS migration

Payload CMS has been replaced by the Prisma-backed DIY CMS at `/admin`. Admin access requires a Google-connected account whose email ends with `@stdev.kr`.

```bash
pnpm db:generate
pnpm db:migrate
pnpm migrate:payload          # dry-run: prints detected Payload rows
pnpm migrate:payload -- --write
pnpm migrate:payload -- --write --copy-s3
```

Set `PAYLOAD_DATABASE_URL` when the old Payload RDS database is separate from the new `DATABASE_URL`. The migration keeps existing S3 object URLs from the old RDS rows, or reconstructs them from `PAYLOAD_S3_BASE_URL`, `prefix`, and `filename` when Payload stored only upload metadata. Add `--copy-s3` to copy objects from `PAYLOAD_S3_SOURCE_BUCKET` to `PAYLOAD_S3_TARGET_BUCKET` with the configured `AWS_REGION`, `AWS_ACCESS_KEY`, and `AWS_SECRET_KEY` instead of only reusing existing URLs.

If your managed Postgres uses self-signed or unverified TLS, set `DATABASE_SSL_REJECT_UNAUTHORIZED=false` and `PAYLOAD_DATABASE_SSL_REJECT_UNAUTHORIZED=false`. Otherwise leave them unset to keep certificate verification enabled.
