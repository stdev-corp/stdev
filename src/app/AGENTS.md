# src/app

Next.js App Router with sibling route groups that share no layout: `(stdev)` for the public site and `(cms)` for the DIY admin.

## STRUCTURE

```
app/
├── (stdev)/              # Public marketing site - owns global <html> + analytics
│   ├── layout.tsx        # Root <html lang="ko">, KRDS stylesheet links, GTM+GA, force-dynamic
│   ├── providers.tsx     # 'use client' - Channel.io boot (no UI framework)
│   ├── page.tsx          # Landing
│   ├── sitemap.ts        # Reads menus.ts → MetadataRoute.Sitemap
│   ├── robots.txt        # Static file (NOT a route handler)
│   ├── {forbidden,unauthorized,not-found,loading}.tsx
│   ├── intro/            # 법인소개   (subtree has own layout + KRDS side nav)
│   ├── business/         # 행사&프로그램 (same pattern)
│   ├── notices/          # 공지사항    (same pattern)
│   └── info/             # 안내 및 공시 (same pattern)
├── (cms)/                # DIY CMS admin pages
│   ├── layout.tsx        # (cms) shell
│   ├── providers.tsx     # admin client providers
│   └── admin/
│       ├── actions.ts                # server actions shared across admin
│       ├── sign-in/                  # public OAuth entry (outside the (shell) auth gate)
│       │   ├── page.tsx
│       │   └── sign-in-form.tsx
│       └── (shell)/                  # auth-gated dashboard chrome
│           ├── layout.tsx            # session guard + sidebar
│           ├── page.tsx              # /admin landing
│           └── {aws,businesses,files,histories,images,institutions,markdowns,reports,settings,webpages}/page.tsx
└── api/auth/[...all]/route.ts # better-auth endpoint
```

## WHERE TO LOOK

| Task                     | Location                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Add a public page        | `(stdev)/<section>/<slug>/page.tsx` + entry in `utils/menus.ts` + path in `utils/links.ts`             |
| New section with sub-nav | Copy `(stdev)/intro/` - has `layout.tsx` wrapping children in `SiteLayout menu={IntroMenu}`            |
| New sitemap entry        | Add a submenu in `utils/menus.ts`; `sitemap.ts` auto-picks it up                                       |
| Error/loading UX         | `(stdev)/{not-found,forbidden,unauthorized,loading}.tsx` - already exist; edit, don't add new siblings |
| Admin/CMS change         | `(cms)/admin/**` + `src/utils/cms.ts` + `prisma/schema.prisma`                                         |

Admin access is limited by `src/utils/admin-auth.ts`: the user must have a Google account row and an email ending in `@stdev.kr`.

## CONVENTIONS

- **Page components are `async` server components** that `await` helpers from `@/utils/cms.ts`. Only declare `'use client'` when you need hooks/state (see `components/krds/header.tsx`, `components/krds/side-navigation.tsx`).
- **Section layouts are one line**: `return <SiteLayout menu={XxxMenu}>{props.children}</SiteLayout>`. `SiteLayout` supplies the whole KRDS shell (skip link, header, breadcrumb, LNB, footer). Copy `intro/layout.tsx` verbatim for new sections.
- **Page bodies follow a fixed shape**: `<PageTitle …/>` then `<div className="conts-area"><div className="g-conts-area"> … </div></div>`. One `g-conts-area` per logical block; `conts-area` supplies the spacing between blocks.
- **Landing `page.tsx` is the only page that uses `MainLayout`** (full-bleed, no breadcrumb or LNB). Do not replicate this pattern for subpages.
- **Metadata** lives on `(stdev)/layout.tsx` globally. Only override per-page via `export const metadata` if strictly needed.
- **Headings**: every page owns exactly one `<h1>`, rendered by `<PageTitle title=… />` as `h1.h-tit`. The landing page uses a visually hidden `<h1 class="sr-only">` because its first visible element is the hero image. Section headings inside content are plain `<h2>`/`<h3>`; `markdown-view.tsx` leaves markdown headings as semantic HTML and styles them via `.markdown-body`.

## ANTI-PATTERNS

- **CMS work belongs under `(cms)/admin` and Prisma utilities**; keep public marketing routes under `(stdev)`.
- **Do not create a new root `layout.tsx`** at `src/app/layout.tsx`. Next.js route groups work because ONLY `(stdev)/layout.tsx` declares `<html>`.
- **Do not remove `export const dynamic = 'force-dynamic'`** from `(stdev)/layout.tsx` - CMS queries run per-request.
- **Do not add client components as page defaults** - keep page.tsx as server async; push interactivity into child `'use client'` components (see `components/krds/header.tsx` and `components/krds/breadcrumb.tsx`).
- **Do not read `process.env.NEXT_PUBLIC_*` without the guarding `throw`** pattern used in `layout.tsx`/`providers.tsx`.

## NOTES

- `robots.txt` is a static file inside the route group (Next.js serves it verbatim) - not a `robots.ts` metadata route.
- `sitemap.ts` must stay in sync with `utils/menus.ts` - there is no other registration.
- `authInterrupts` is enabled (`next.config.ts`), so `forbidden()`/`unauthorized()` from `next/navigation` work and are rendered by the sibling files.
- The breadcrumb is derived, not passed: `components/krds/breadcrumb.tsx` resolves `usePathname()` through `utils/breadcrumb.ts`, which reads `utils/menus.ts`. A new page shows up in the breadcrumb only once it is registered as a sub-menu there.
