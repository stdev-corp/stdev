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
      BETTER_AUTH_SECRET: example
      BETTER_AUTH_URL: https://www.stdev.kr
      GOOGLE_CLIENT_ID: example.apps.googleusercontent.com
      GOOGLE_CLIENT_SECRET: example
      AWS_REGION: ap-northeast-2
      AWS_ACCESS_KEY: example
      AWS_SECRET_KEY: example
      S3_BUCKET: stdev-kr
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
