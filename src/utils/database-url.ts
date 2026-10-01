// The local Postgres used by `pnpm dev`, CI and E2E has no TLS. Every other
// host gets libpq-style `sslmode=require` (encrypted, certificate not checked),
// not just *.rds.amazonaws.com: a custom domain CNAMEd to RDS would otherwise
// connect in plaintext. An sslmode already in the URL wins, so a remote server
// without TLS can opt out with `?sslmode=disable`.
const localHosts = new Set(['', 'localhost', '127.0.0.1', '[::1]'])

export function withDatabaseSslParams(databaseUrl: string) {
  let url: URL
  try {
    url = new URL(databaseUrl)
  } catch {
    return databaseUrl
  }

  if (localHosts.has(url.hostname)) {
    return databaseUrl
  }

  if (!url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'require')
  }

  if (!url.searchParams.has('uselibpqcompat')) {
    url.searchParams.set('uselibpqcompat', 'true')
  }

  return url.toString()
}
