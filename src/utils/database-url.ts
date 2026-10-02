// The local Postgres used by `pnpm dev`, CI and E2E has no TLS. Every other
// host gets libpq-style `sslmode=require` (encrypted, certificate not checked),
// not just *.rds.amazonaws.com: a custom domain CNAMEd to RDS would otherwise
// connect in plaintext.
//
// A non-RDS connection that already configures TLS in any way pg understands
// keeps it untouched, as it did before this helper covered such hosts: a TLS
// parameter in the URL, or PGSSLMODE, which pg only consults when the URL brings
// no TLS setting of its own. Adding sslmode/uselibpqcompat would turn a
// provider's `sslmode=require`, an `sslrootcert` or `PGSSLMODE=verify-full` from
// a verified connection into an unverified one, `sslmode=no-verify` into a
// verified one, and make `sslmode=verify-ca` throw. RDS URLs keep the rules they
// have always had (require unless the URL picks an sslmode, plus uselibpqcompat
// so require means encrypt-only), since Node does not trust the RDS CA.
//
// The URL is read the way pg-connection-string and pg read it: a repeated key
// takes its last value, an empty value counts as unset, and the host falls back
// from `?host=` to the authority to PGHOST.
const tlsParams = ['sslmode', 'ssl', 'sslrootcert', 'sslcert', 'sslkey']

// pg-connection-string's stand-in for the empty host of `user:pass@/db`, which
// WHATWG rejects.
const placeholderHost = '___DUMMY___'

function lastParam(url: URL, name: string) {
  return url.searchParams.getAll(name).at(-1) || null
}

function parseDatabaseUrl(databaseUrl: string) {
  const attempts = [
    { input: databaseUrl, hasHost: true },
    {
      input: databaseUrl.replace('@/', `@${placeholderHost}/`),
      hasHost: false,
    },
  ]

  for (const { input, hasHost } of attempts) {
    try {
      return { url: new URL(input), hasHost }
    } catch {
      continue
    }
  }

  return null
}

// The host pg will actually connect to: `?host=` wins over the authority, which
// wins over PGHOST, and a host starting with `/` is a Unix socket directory
// (URL-encoded when it sits in the authority). A special scheme normalizes what
// postgres: leaves as written: case, IPv4 spellings such as 127.1 and IPv6
// spellings of ::1. An IPv6 zone (::1%lo0) does not change the address, and an
// IPv4-mapped IPv6 address (::ffff:127.0.0.1, which WHATWG writes as
// [::ffff:7f00:1]) reaches the IPv4 address it wraps.
function connectionHost(url: URL, hasHost: boolean) {
  let authority = hasHost ? url.hostname : ''

  try {
    authority = decodeURIComponent(authority)
  } catch {
    // pg-connection-string would throw here too; classify the raw text.
  }

  const host = lastParam(url, 'host') || authority || process.env.PGHOST || ''

  if (host === '' || host.startsWith('/')) {
    return host
  }

  const unscoped = host.includes(':') ? host.replace(/%.*$/, '') : host

  // WHATWG reads a leading-zero part such as 0177 as octal, but not every
  // resolver does (macOS reads 0177.0.0.1 as 177.0.0.1), so do not guess.
  if (
    /^[\d.]+$/.test(unscoped) &&
    unscoped.split('.').some((part) => /^0\d/.test(part))
  ) {
    return unscoped
  }

  let hostname: string

  try {
    const bracketed =
      unscoped.includes(':') && !unscoped.startsWith('[')
        ? `[${unscoped}]`
        : unscoped
    hostname = new URL(`http://${bracketed}`).hostname.replace(/\.$/, '')
  } catch {
    return unscoped.toLowerCase()
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
  const parsed = parseDatabaseUrl(databaseUrl)

  if (!parsed) {
    return databaseUrl
  }

  const { url, hasHost } = parsed
  const host = connectionHost(url, hasHost)

  if (isLocalHost(host)) {
    return databaseUrl
  }

  const isRds = host.endsWith('.rds.amazonaws.com')
  const choosesTls =
    Boolean(process.env.PGSSLMODE) ||
    tlsParams.some((name) => lastParam(url, name))

  if (!isRds && choosesTls) {
    return databaseUrl
  }

  if (!lastParam(url, 'sslmode')) {
    url.searchParams.set('sslmode', 'require')
  }

  if (!lastParam(url, 'uselibpqcompat')) {
    url.searchParams.set('uselibpqcompat', 'true')
  }

  const serialized = url.toString()
  return hasHost ? serialized : serialized.replace(`@${placeholderHost}/`, '@/')
}
