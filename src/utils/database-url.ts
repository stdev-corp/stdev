// The local Postgres used by `pnpm dev`, CI and E2E has no TLS. Every other
// host gets libpq-style `sslmode=require` (encrypted, certificate not checked),
// not just *.rds.amazonaws.com: a custom domain CNAMEd to RDS would otherwise
// connect in plaintext. A TLS choice already in the URL wins: any sslmode (so a
// remote server without TLS can opt out with `?sslmode=disable`), and on
// non-RDS hosts node-postgres's own `ssl`, whose `ssl=true` verifies the
// certificate where require would not. RDS URLs keep getting require next to
// `ssl`, as before: Node does not trust the RDS CA, so `ssl=true` alone fails.
const localHosts = new Set(['', 'localhost', '127.0.0.1', '[::1]'])

export function withDatabaseSslParams(databaseUrl: string) {
  let url: URL
  try {
    url = new URL(databaseUrl)
  } catch {
    return databaseUrl
  }

  // postgres: is not a WHATWG special scheme, so the hostname keeps its case.
  const hostname = url.hostname.toLowerCase()
  const isRds = hostname.endsWith('.rds.amazonaws.com')

  if (localHosts.has(hostname) || (!isRds && url.searchParams.has('ssl'))) {
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
