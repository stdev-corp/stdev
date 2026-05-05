# src/utils/db

Payload CMS collection configs. Each file exports a single `CollectionConfig` constant that is registered in `/payload.config.ts`.

## FILES
| File | Slug | Purpose |
|------|------|---------|
| `businesses.ts` | `businesses` | Events/programs (해커톤, 컨퍼런스 etc.) with date range |
| `webpages.ts` | `webpages` | External links (blog/news/press), joined to `businesses` |
| `reports.ts` | `reports` | PDF reports (총회/이사회 records) - uploads via `files` |
| `histories.ts` | `histories` | 연혁 timeline entries with image |
| `institutions.ts` | `institutions` | Partner orgs (logo scroller on landing) |
| `markdowns.ts` | `markdowns` | Versioned legal docs (`articles` 정관, `privacy`, `terms`) |
| `images.ts` | `images` | Upload collection, S3 prefix `images/` |
| `files.ts` | `files` | Upload collection, PDFs only, S3 prefix `files/` |

## CONVENTIONS
- Export a **named `const`** matching a PascalCase pluralized form (`Businesses`, `Webpages`, …) typed `CollectionConfig`.
- Always set `access: { read: () => true }` - site is public-read; writes require admin auth (Payload default).
- Always set `timestamps: true` - `createdAt`/`updatedAt` are relied on by admin UI.
- **Korean `label`** fields are used where admin-facing clarity matters (see `histories.ts`, `institutions.ts`, `markdowns.ts`). English-only field names are fine when semantics are obvious.
- **Unique enums use `select`** with `{ label: '한글', value: 'snake_case_en' }` - values are queried by string in `@/utils/payload.ts` (e.g. `queryWebpages('news_article')`). Do not rename existing values - it breaks queries.
- **Upload collections** (`images.ts`, `files.ts`) declare `upload: { staticDir, mimeTypes }`. S3 `prefix` is configured in `payload.config.ts`, not here.
- **Relationships use string slugs** (`relationTo: 'businesses'`) - keep slugs stable.

## ANTI-PATTERNS
- **Do not add logic/hooks** here unless registered through Payload's hook API on the config. These files are pure config.
- **Do not change existing `select` option `value`s** without a DB migration - persisted rows reference the string.
- **Do not forget to register** a new collection in `payload.config.ts` `collections: [...]` AND run `pnpm generate:types`. `src/generated/payload-types.ts` MUST be regenerated or TS will break elsewhere.
- **Do not tighten `access.read`** without updating every public page under `(stdev)/` that currently assumes anonymous reads work.
- **Do not import these files from client components** - they pull Payload's server-only deps.

## ADD-A-COLLECTION CHECKLIST
1. Create `src/utils/db/<plural>.ts` mirroring `businesses.ts`.
2. Import + add to `collections: [...]` in `payload.config.ts` (keep alphabetical).
3. `pnpm generate:types` → commits `src/generated/payload-types.ts`.
4. Add reader in `@/utils/payload.ts` (server-only `queryXxx`).
5. Consume from an `async` page under `src/app/(stdev)/`.
