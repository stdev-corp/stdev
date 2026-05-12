# PROJECT KNOWLEDGE BASE

## OVERVIEW

STDev Corp. (사단법인 에스티데브) Korean nonprofit homepage. Next.js 16 App Router + React 19 + Prisma/Postgres DIY CMS + better-auth + Chakra UI v3, shipped as a standalone Docker image.

## STRUCTURE

```
stdev/
├── prisma/schema.prisma      # CMS/auth data model
├── prisma.config.ts          # Prisma config; reads DATABASE_URL
├── src/
│   ├── app/                  # (stdev) public site, (cms) admin, api/auth
│   ├── components/           # UI building blocks
│   └── utils/                # cms.ts, prisma.ts, auth.ts, menus/links/date helpers
├── public/images/            # intro/, business/, gov/ static assets
└── .github/workflows/        # ci.yml (build+lint), cd.yml (ghcr.io image)
```

## WHERE TO LOOK

| Task                    | Location                                                                               | Notes                                                     |
| ----------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Change CMS schema       | `prisma/schema.prisma`                                                                 | Then run `pnpm db:generate` and create/apply a migration  |
| Public CMS query        | `src/utils/cms.ts`                                                                     | Server-only helpers used by async pages                   |
| Prisma client           | `src/utils/prisma.ts`                                                                  | Reuses one client during dev hot reload                   |
| Auth config             | `src/utils/auth.ts` + `src/utils/admin-auth.ts` + `src/app/api/auth/[...all]/route.ts` | Google-only better-auth with Prisma adapter               |
| Admin UI                | `src/app/(cms)/admin/**`                                                               | DIY CMS forms protected by better-auth                    |
| Add a public page/route | `src/app/(stdev)/<path>/page.tsx`                                                      | Also update `src/utils/menus.ts` and `src/utils/links.ts` |
| Shared layout chrome    | `src/components/layout/`                                                               | `basic-layout`, `left-menu-layout`, `navbar`, `footer`    |
| Markdown rendering      | `src/components/markdown/markdown-view.tsx`                                            | Chakra-mapped react-markdown + remark-gfm                 |

## CONVENTIONS

- **Package manager**: pnpm@10.33.3 only. Never commit a non-pnpm lockfile.
- **Prettier**: `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `tabWidth: 2`.
- **Import alias**: `@/*` → `./src/*`.
- **Server vs client**: Pages are async server components by default. Client components declare `'use client'`.
- **Rendering**: `(stdev)/layout.tsx` sets `export const dynamic = 'force-dynamic'` for request-time CMS reads.
- **Locale**: `<html lang="ko">` + Korean UI strings; dates format as `YYYY년 M월 D일`.
- **Styling**: Public site uses Chakra v3 primitives. Admin currently uses simple React/HTML forms.
- **Env enforcement**: Required public envs are thrown on missing in layout/providers.

## ANTI-PATTERNS

- Do not edit generated Prisma client output in `node_modules`; change `prisma/schema.prisma` and regenerate.
- Do not add semicolons.
- Do not statically render `(stdev)`.
- Do not add new image remote hosts without updating `next.config.ts` `images.remotePatterns`.

## COMMANDS

```bash
pnpm dev                    # Next.js dev server on :3000
pnpm build                  # Production build
pnpm start                  # Run production build
pnpm lint                   # ESLint + prettier integration
pnpm prettier:write         # Format all
pnpm prettier:check         # CI-style check
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Local schema migration
pnpm db:migrate:deploy      # Production migration deploy
```

## NOTES

- No test suite exists. CI runs build + lint.
- Docker prod port is 1000.
- Existing S3 object URLs are preserved as CMS asset URLs; remote host is `stdev-kr.s3.ap-northeast-2.amazonaws.com`.
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `DATABASE_URL` are required for the CMS/auth stack.
