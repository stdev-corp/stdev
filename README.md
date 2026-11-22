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

Playwright E2E 테스트는 실제 브라우저, Next.js 서버, 테스트용 Postgres DB, S3 sidecar(MinIO fork인 Silo)가 필요합니다. 처음 실행하는 환경에서는 Chromium 브라우저를 먼저 설치합니다.

```bash
pnpm test:e2e:install
```

그 다음 E2E 테스트를 실행합니다. 이 명령은 레포에 커밋된 `.env.test`를 사용합니다. `.env`를 따로 만들 필요가 없고, `.env`나 `.env.local`이 있어도 `.env.test`에 있는 값이 우선합니다. 다만 셸에서 export한 환경 변수는 `.env.test`보다 우선하고, `.env.test`에 없는 키는 `.env`/`.env.local` 값이 그대로 쓰입니다. seed가 DB를 초기화하므로 `DATABASE_URL`을 export한 셸에서는 실행하지 마세요. 먼저 `.env.test` 값으로 Next.js를 빌드하고, `docker-compose.test.yml`의 Postgres와 Silo를 띄운 뒤 Prisma migration과 dummy data seed를 적용한 다음 Playwright를 실행합니다. `.env.test`에 `AWS_ENDPOINT_URL_S3=http://127.0.0.1:9000`이 설정돼 있어 S3Client는 실제 AWS가 아닌 로컬 Silo로 붙습니다.

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

## 노션 행사 페이지 이관

event.stdev.kr(Oopy)에 있던 노션 행사 페이지는 `src/scripts/notion-import/`로 CMS에 옮긴다.
변환 결과(`content/`)는 저장소에 있으므로 운영 반영은 마지막 단계만 실행하면 된다.

```bash
pnpm notion:import --env-file .env --dry-run   # 무엇을 넣을지 확인
pnpm notion:import --env-file .env             # S3 업로드 + DB 반영
```

노션 원문을 다시 받아 변환하려면 `pnpm notion:fetch` 후 `pnpm notion:convert`를 실행한다.
가져오기는 여러 번 실행해도 안전하며, 관리자 화면에서 고친 행사는 `--force` 없이는 덮어쓰지 않는다. 원본이 사라진(403/404/410) 이미지만 경고하고 본문에서 빼고, S3 자격 증명·업로드·DB·네트워크 오류가 나면 기관이나 행사를 저장하기 전에 멈춘다. 행사와 그 하위 페이지는 한 트랜잭션으로 저장된다. `notion:convert`도 외부 이미지가 403/404/410이거나 도메인이 없어졌을 때만 빼고, 시간 초과·네트워크·429·5xx는 다시 시도한 뒤에도 실패하면 `content/`를 바꾸지 않고 멈춘다. 기관은 국문명이 같은 기존 기관, 없으면 `mapping.ts`의 `INSTITUTION_ALIASES`로 짝지은 기존 기관(예: `KAIST` → `카이스트`)에 연결하고, 둘 다 없을 때만 홈 노출을 끈 채로 새로 만든다. 본문과 데이터베이스 행 본문에 붙은 파일·PDF(블로그 후기 PDF, 보도자료 기사 PDF·HWP)는 내려받기 링크 없이 S3에 보관해 관리자 '파일'에서만 보인다.

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
- S3_BUCKET=stdev-kr
- AWS_REGION=ap-northeast-2

이 값은 `main`에 push될 때의 이미지 빌드에서만 쓰입니다. PR의 `Build Docker Image`는 이미지를 push하지 않으므로 `.env.test`의 dummy 값으로 빌드합니다. Dependabot이나 fork PR은 Actions secrets를 읽을 수 없기 때문입니다.

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
