export function withDatabaseSslParams(databaseUrl: string) {
  const url = new URL(databaseUrl)

  if (!url.hostname.endsWith('.rds.amazonaws.com')) {
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
