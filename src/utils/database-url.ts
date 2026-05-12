export function withDatabaseSslParams(databaseUrl: string) {
  let url: URL
  try {
    url = new URL(databaseUrl)
  } catch {
    return databaseUrl
  }

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
