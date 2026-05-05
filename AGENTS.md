# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-06
**Commit:** 8ad9467
**Branch:** feat@add-contents-with-payload

## OVERVIEW
STDev Corp. (사단법인 에스티데브) Korean nonprofit homepage. Next.js 16 App Router + React 19 + Payload CMS 3 (Postgres) + Chakra UI v3, shipped as a standalone Docker image.

## STRUCTURE
```
stdev/
├── payload.config.ts        # Payload root config - registers 8 collections, S3, SMTP, Postgres
├── next.config.ts           # `output: 'standalone'` (required for Docker), authInterrupts ON
├── src/
│   ├── app/                 # Two route groups: (stdev) public site, (payload) CMS admin
│   ├── components/          # UI building blocks (Chakra v3 primitives)
│   ├── utils/               # payload.ts = server-only query layer; db/ = collection configs
│   └── generated/           # payload-types.ts - AUTOGEN, never edit
├── public/images/           # intro/, business/, gov/ static assets
└── .github/workflows/       # ci.yml (build+lint), cd.yml (ghcr.io image)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a Payload collection | `src/utils/db/<name>.ts` + register in `payload.config.ts` | Then `pnpm generate:types` |
| Add a new page/route | `src/app/(stdev)/<path>/page.tsx` | Also add to `src/utils/menus.ts` + `src/utils/links.ts` |
| New URL path constant | `src/utils/links.ts` | Static class; referenced by menus.ts and sitemap |
| New navigation entry | `src/utils/menus.ts` | Drives Navbar + left-menu + sitemap.ts |
| CMS data query | `src/utils/payload.ts` | `'use server'` module; uses `getPayload({ config })` |
| Shared layout chrome | `src/components/layout/` | `basic-layout`, `left-menu-layout`, `navbar`, `footer` |
| Markdown rendering | `src/components/markdown/markdown-view.tsx` | Chakra-mapped react-markdown + remark-gfm |
| Admin UI | `src/app/(payload)/admin/**` | **AUTOGEN by Payload - do not edit** |

## CONVENTIONS
- **Package manager**: pnpm@10.33.3 only (Dockerfile + CI use `pnpm --frozen-lockfile`). Never commit a non-pnpm lockfile.
- **Prettier**: `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `tabWidth: 2`. No semicolons.
- **Import alias**: `@/*` → `./src/*`, `@payload-config` → `./payload.config.ts`.
- **Server vs client**: Pages are **async server components by default**; data-fetching helpers live in `@/utils/payload.ts` with `'use server'`. Client components declare `'use client'` at top (e.g. `navbar.tsx`, `providers.tsx`).
- **Rendering**: `(stdev)/layout.tsx` sets `export const dynamic = 'force-dynamic'` - site is not statically cached.
- **Locale**: `<html lang="ko">` + Korean UI strings; dates formatted `'YYYY년 M월 D일'` via `@/utils/datetime.ts` (Asia/Seoul).
- **Styling**: Chakra v3 primitives (`Box`, `Flex`, `Stack`, `Heading`). Inline `style={}` only inside `markdown-view.tsx` component overrides. No CSS modules, no Tailwind.
- **Env enforcement**: Required public envs (`NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CHANNEL_PLUGIN_KEY`) are `throw`n on missing in layout/providers - do NOT fallback to defaults.

## ANTI-PATTERNS (THIS PROJECT)
- **Never edit `src/generated/payload-types.ts`** - regenerate via `pnpm generate:types` after collection changes. It is ignored by ESLint.
- **Never edit `src/app/(payload)/layout.tsx` or `src/app/(payload)/admin/importMap.js`** - headers say `THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD`.
- **Do not add semicolons** - violates prettier config; CI `pnpm lint` + `prettier:check` will catch it.
- **Do not statically render `(stdev)`** - `dynamic = 'force-dynamic'` is intentional (Payload reads at request time).
- **Do not bypass `@/utils/payload.ts`** for data - all CMS reads go through its `queryX`/`getX` helpers so mapping stays centralized.
- **Do not add new image remote hosts** without updating `next.config.ts` `images.remotePatterns`.

## UNIQUE STYLES
- **Route groups split concerns**: `(stdev)` = public marketing, `(payload)` = admin + REST/GraphQL. They share nothing - separate layouts, separate metadata.
- **Menu-driven architecture**: `IntroMenu`/`BusinessMenu`/`NoticesMenu`/`InfoMenu` in `utils/menus.ts` are the single source of truth for nav, left rails, and sitemap.ts.
- **Payload collection files are pure config exports** (no classes, no extra logic) - see `src/utils/db/AGENTS.md`.
- **Hardcoded i18n**: All user-facing strings are Korean literals in JSX. No i18n library.

## COMMANDS
```bash
pnpm dev                    # Next.js dev server on :3000
pnpm build                  # Production build (runs in CI)
pnpm start                  # Run production build
pnpm lint                   # ESLint (next config + prettier)
pnpm prettier:write         # Format all
pnpm prettier:check         # CI-style check
pnpm generate:types         # Regenerate src/generated/payload-types.ts
pnpm generate:importmap     # Regenerate src/app/(payload)/admin/importMap.js
```

## NOTES
- **No test suite exists**. CI runs only `pnpm build` + `pnpm lint`. Do not invent `pnpm test`.
- **Docker prod port is 1000** (not 3000) - `ENV PORT=1000` in Dockerfile; reverse-proxy in front. Deploy image: `ghcr.io/stdev-kr/stdev:main`.
- **S3 region is hardcoded** `ap-northeast-2`, bucket `stdev-kr` (see `payload.config.ts`).
- **Postgres SSL**: `rejectUnauthorized: false` - intentional for self-signed managed DB certs.
- **NEXT_PUBLIC_* vars are Docker build secrets** (see `cd.yml` + `Dockerfile` `--mount=type=secret`), baked into the image at build time.
- **`experimental.authInterrupts: true`** enables `forbidden()`/`unauthorized()` - see `src/app/(stdev)/forbidden.tsx`, `unauthorized.tsx`.
