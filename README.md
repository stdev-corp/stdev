# STDev Homepage

[![CI](https://github.com/stdev-kr/stdev/actions/workflows/ci.yml/badge.svg)](https://github.com/stdev-kr/stdev/actions/workflows/ci.yml)
[![CD](https://github.com/stdev-kr/stdev/actions/workflows/cd.yml/badge.svg)](https://github.com/stdev-kr/stdev/actions/workflows/cd.yml)
[![codecov](https://codecov.io/gh/stdev-corp/stdev/graph/badge.svg?token=ZLV3V4LE1Y)](https://codecov.io/gh/stdev-corp/stdev)

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

## Test

테스트는 목적에 따라 단위/컴포넌트 테스트, 커버리지 테스트, E2E 테스트로 나누어 실행합니다.

### 단위/컴포넌트/통합 테스트

브라우저나 실제 DB 연결이 필요 없는 Vitest 테스트를 실행합니다. 컴포넌트 테스트는 React Testing Library와 jsdom 환경에서 실행됩니다.

```bash
pnpm test
```

개발 중에는 watch mode를 사용할 수 있습니다.

```bash
pnpm test:watch
```

### 커버리지 확인

전체 Vitest 테스트를 실행하고 V8 coverage 리포트를 생성합니다. 프로젝트 커버리지 기준은 95% 이상입니다.

```bash
pnpm test:coverage
```

CI에서 사용하는 JUnit 리포트까지 함께 생성하려면 아래 명령을 실행합니다.

```bash
pnpm test:ci
```

### E2E 테스트

Playwright E2E 테스트는 실제 브라우저, Next.js 서버, 테스트용 Postgres DB, MinIO (S3 mock)가 필요합니다. 처음 실행하는 환경에서는 Chromium 브라우저를 먼저 설치합니다.

```bash
pnpm test:e2e:install
```

그 다음 E2E 테스트를 실행합니다. 이 명령은 레포에 커밋된 `.env.test`를 사용하고, `docker-compose.test.yml`의 Postgres와 MinIO를 띄운 뒤 Prisma migration과 dummy data seed를 적용한 다음 Playwright를 실행합니다. `.env.test`에 `AWS_ENDPOINT_URL_S3=http://127.0.0.1:9000`이 설정돼 있어 S3Client는 실제 AWS가 아닌 로컬 MinIO로 붙습니다.

```bash
pnpm test:e2e
```

UI 모드로 테스트를 확인하려면 아래 명령을 사용합니다.

```bash
pnpm test:e2e:ui
```

### 테스트 파일 위치

- 단위/컴포넌트 테스트: 대상 파일 옆의 `*.test.ts` 또는 `*.test.tsx`
- 통합 테스트: `src/tests/**`
- E2E 테스트: `src/e2e/**`

## How to deploy

Github 레포지토리 설정에서 `Actions secrets and variables` 페이지로 이동한 후 `Repository secrets`에 아래 값을 입력합니다.

- NEXT_PUBLIC_CHANNEL_PLUGIN_KEY=example
- NEXT_PUBLIC_GTM_ID=GTM-example
- NEXT_PUBLIC_GA_ID=G-example
- DATABASE_URL=postgres://user:password@url:port/schema
- BETTER_AUTH_SECRET=example
- BETTER_AUTH_URL=<https://www.stdev.kr>
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

컨테이너를 올리기 전에 Prisma 스키마 마이그레이션을 먼저 적용합니다. 배포 이미지에 Prisma CLI와 마이그레이션 파일이 함께 들어 있으므로, 서버에 레포지토리를 체크아웃하거나 Node.js를 설치하지 않고 이미지만으로 실행할 수 있습니다. `DATABASE_URL`은 위 `docker-compose.yml`의 `environment`에서 그대로 주입됩니다.

```bash
docker compose run --rm stdev pnpm db:migrate:deploy
```

그 다음 아래 명령을 실행합니다.

```bash
docker compose up -d
```

이미 떠 있는 컨테이너에 마이그레이션을 적용하려면 아래 명령을 사용합니다.

```bash
docker compose exec stdev pnpm db:migrate:deploy
```

Port `1000` 번에 Reverse Proxy를 붙입니다.
