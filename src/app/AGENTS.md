# src/app

Next.js App Router with sibling route groups that share no layout: `(stdev)` for the public site and `(cms)` for the DIY admin.

## STRUCTURE

```
app/
├── (stdev)/              # Public marketing site - owns global <html> + analytics
│   ├── layout.tsx        # Root <html lang="ko">, GTM+GA, force-dynamic
│   ├── providers.tsx     # 'use client' - Chakra v3 + Channel.io boot
│   ├── page.tsx          # Landing
│   ├── sitemap.ts        # Reads menus.ts → MetadataRoute.Sitemap
│   ├── robots.txt        # Static file (NOT a route handler)
│   ├── {forbidden,unauthorized,not-found,loading}.tsx
│   ├── intro/            # 법인소개   (subtree has own layout + LeftMenu)
│   ├── business/         # 행사&프로그램 (same pattern)
│   ├── notices/          # 공지사항    (same pattern)
│   └── info/             # 안내 및 공시 (same pattern)
├── (cms)/                # DIY CMS admin pages
│   ├── layout.tsx
│   └── admin/
│       ├── page.tsx
│       ├── actions.ts
│       └── sign-in/page.tsx
└── api/auth/[...all]/route.ts # better-auth endpoint
```

## WHERE TO LOOK

| Task                     | Location                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Add a public page        | `(stdev)/<section>/<slug>/page.tsx` + entry in `utils/menus.ts` + path in `utils/links.ts`             |
| New section with sub-nav | Copy `(stdev)/intro/` - has `layout.tsx` wrapping children in `LeftMenuLayout menu={IntroMenu}`        |
| New sitemap entry        | Add a submenu in `utils/menus.ts`; `sitemap.ts` auto-picks it up                                       |
| Error/loading UX         | `(stdev)/{not-found,forbidden,unauthorized,loading}.tsx` - already exist; edit, don't add new siblings |
| Admin/CMS change         | `(cms)/admin/**` + `src/utils/cms.ts` + `prisma/schema.prisma`                                         |

Admin access is limited by `src/utils/admin-auth.ts`: the user must have a Google account row and an email ending in `@stdev.kr`.

## CONVENTIONS

- **Page components are `async` server components** that `await` helpers from `@/utils/cms.ts`. Only declare `'use client'` when you need hooks/state (see `intro/directors/table.tsx`, `navbar.tsx`).
- **Section layouts follow a fixed shape**: `<Navigation />` → `<LeftMenuLayout menu={XxxMenu}>{children}</LeftMenuLayout>` → `<Footer />`. Copy `intro/layout.tsx` verbatim for new sections.
- **Landing `page.tsx` is the only page that embeds `<Navigation />`+`<Footer />` directly** (no section layout). Do not replicate this pattern for subpages.
- **Metadata** lives on `(stdev)/layout.tsx` globally. Only override per-page via `export const metadata` if strictly needed.
- **Headings**: pages use `<Heading as="h1" size="xl">` via Chakra - `markdown-view.tsx` remaps `#..#####` to Chakra `Heading`.

## ANTI-PATTERNS

- **CMS work belongs under `(cms)/admin` and Prisma utilities**; keep public marketing routes under `(stdev)`.
- **Do not create a new root `layout.tsx`** at `src/app/layout.tsx`. Next.js route groups work because ONLY `(stdev)/layout.tsx` declares `<html>`.
- **Do not remove `export const dynamic = 'force-dynamic'`** from `(stdev)/layout.tsx` - CMS queries run per-request.
- **Do not add client components as page defaults** - keep page.tsx as server async; push interactivity into child `'use client'` components (see directors: `page.tsx` server + `table.tsx` client).
- **Do not read `process.env.NEXT_PUBLIC_*` without the guarding `throw`** pattern used in `layout.tsx`/`providers.tsx`.

## NOTES

- `robots.txt` is a static file inside the route group (Next.js serves it verbatim) - not a `robots.ts` metadata route.
- `sitemap.ts` must stay in sync with `utils/menus.ts` - there is no other registration.
- `authInterrupts` is enabled (`next.config.ts`), so `forbidden()`/`unauthorized()` from `next/navigation` work and are rendered by the sibling files.
