// The local Postgres used by `pnpm dev`, CI and E2E has no TLS. Every other
// host gets libpq-style `sslmode=require` (encrypted, certificate not checked),
// not just *.rds.amazonaws.com: a custom domain CNAMEd to RDS would otherwise
// connect in plaintext.
//
// A non-RDS URL that already configures TLS in any way pg understands keeps it
// untouched, as it did before this helper covered such hosts: adding
// uselibpqcompat would turn a provider's `sslmode=require` or an `sslrootcert`
// from a verified connection into an unverified one, `sslmode=no-verify` into a
// verified one, and make `sslmode=verify-ca` throw. RDS URLs keep the rules they
// have always had (require unless the URL picks an sslmode, plus uselibpqcompat
// so require means encrypt-only), since Node does not trust the RDS CA.
//
// Parameters are read the way pg-connection-string reads them: a repeated key
// takes its last value, and an empty value counts as unset.
const tlsParams = ['sslmode', 'ssl', 'sslrootcert', 'sslcert', 'sslkey']

function lastParam(url: URL, name: string) {
  return url.searchParams.getAll(name).at(-1) || null
}

// The host pg will actually connect to: `?host=` wins over the authority, and a
// host starting with `/` is a Unix socket directory (URL-encoded when it sits in
// the authority). A special scheme normalizes what postgres: leaves as written:
// case, IPv4 spellings such as 127.1 and IPv6 spellings of ::1. An IPv4-mapped
// IPv6 address (::ffff:127.0.0.1, which WHATWG writes as [::ffff:7f00:1])
// reaches the IPv4 address it wraps, so it is returned as that address.
function connectionHost(url: URL) {
  const raw = lastParam(url, 'host') || url.hostname
  let host: string

  try {
    host = decodeURIComponent(raw)
  } catch {
    host = raw
  }

  if (host === '' || host.startsWith('/')) {
    return host
  }

  // WHATWG reads a leading-zero part such as 0177 as octal, but not every
  // resolver does (macOS reads 0177.0.0.1 as 177.0.0.1), so do not guess.
  if (
    /^[\d.]+$/.test(host) &&
    host.split('.').some((part) => /^0\d/.test(part))
  ) {
    return host
  }

  let hostname: string

  try {
    const bracketed =
      host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
    hostname = new URL(`http://${bracketed}`).hostname.replace(/\.$/, '')
  } catch {
    return host.toLowerCase()
  }

  const mapped = /^\[::ffff:([\da-f]{1,4}):([\da-f]{1,4})\]$/.exec(hostname)

  if (!mapped) {
    return hostname
  }

  const [high, low] = [mapped[1], mapped[2]].map((part) => parseInt(part, 16))
  return [high >> 8, high & 255, low >> 8, low & 255].join('.')
}

function isLocalHost(host: string) {
  return (
    host === '' ||
    host.startsWith('/') ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host === '[::]' ||
    host === '[::1]' ||
    /^127(?:\.\d+){3}$/.test(host)
  )
}

export function withDatabaseSslParams(databaseUrl: string) {
  let url: URL
  try {
    url = new URL(databaseUrl)
  } catch {
    return databaseUrl
  }

  const host = connectionHost(url)

  if (isLocalHost(host)) {
    return databaseUrl
  }

  const isRds = host.endsWith('.rds.amazonaws.com')

  if (!isRds && tlsParams.some((name) => lastParam(url, name))) {
    return databaseUrl
  }

  if (!lastParam(url, 'sslmode')) {
    url.searchParams.set('sslmode', 'require')
  }

  if (!lastParam(url, 'uselibpqcompat')) {
    url.searchParams.set('uselibpqcompat', 'true')
  }

  return url.toString()
}
