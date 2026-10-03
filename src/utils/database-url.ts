// The local Postgres used by `pnpm dev`, CI and E2E has no TLS. Every other
// host gets libpq-style `sslmode=require` (encrypted, certificate not checked),
// not just *.rds.amazonaws.com: a custom domain CNAMEd to RDS would otherwise
// connect in plaintext.
//
// A non-RDS connection that already configures TLS in any way pg understands
// keeps it untouched, as it did before this helper covered such hosts: a TLS
// parameter in the URL, or a PGSSLMODE that pg recognises, which pg only
// consults when the URL leaves `ssl` undefined (an `ssl` key counts even when
// empty). Adding sslmode/uselibpqcompat would turn a provider's
// `sslmode=require`, an `sslrootcert` or `PGSSLMODE=verify-full` from
// a verified connection into an unverified one, `sslmode=no-verify` into a
// verified one, and make `sslmode=verify-ca` throw. RDS URLs keep the rules they
// have always had (require unless the URL picks an sslmode, plus uselibpqcompat
// so require means encrypt-only), since Node does not trust the RDS CA.
//
// The URL is read the way pg-connection-string and pg read it: a repeated key
// takes its last value, an empty value counts as unset, and the host falls back
// from `?host=` to the authority to PGHOST.
const tlsParams = ['sslmode', 'ssl', 'sslrootcert', 'sslcert', 'sslkey']

// The PGSSLMODE values pg acts on. Anything else (allow, REQUIRE, a typo) is
// ignored and pg connects in plaintext, so it is no TLS choice at all.
const pgSslModes = [
  'disable',
  'prefer',
  'require',
  'verify-ca',
  'verify-full',
  'no-verify',
]

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

  // Resolvers disagree on a leading-zero part: WHATWG, glibc and musl read 0177
  // as octal, while macOS reads it as decimal in a full four-part address
  // (0177.0.0.1 is 177.0.0.1 there) and as octal in a shorter one. Count such a
  // host as local only when both readings are loopback, as 127.01 is.
  if (
    /^[\d.]+$/.test(unscoped) &&
    unscoped.split('.').some((part) => /^0\d/.test(part))
  ) {
    const parts = unscoped.replace(/\.$/, '').split('.')
    const decimalSpelling =
      parts.length === 4
        ? parts.map((part) => part.replace(/^0+(?=\d)/, '')).join('.')
        : unscoped
    const [octal, decimal] = [unscoped, decimalSpelling].map(normalizeHost)
    return octal && decimal && isLocalHost(octal) && isLocalHost(decimal)
      ? octal
      : unscoped
  }

  return normalizeHost(unscoped) ?? unscoped.toLowerCase()
}

function normalizeHost(host: string) {
  let hostname: string

  try {
    const bracketed =
      host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
    hostname = new URL(`http://${bracketed}`).hostname.replace(/\.$/, '')
  } catch {
    return null
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
    // Only canonical octets: normalizeHost returns every real IPv4 address in
    // that form, so anything else (127.0.0.256) reaches the OS as a hostname.
    /^127(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(host)
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
    tlsParams.some((name) => lastParam(url, name)) ||
    (pgSslModes.includes(process.env.PGSSLMODE ?? '') &&
      !url.searchParams.has('ssl'))

  if (!isRds && choosesTls) {
    return databaseUrl
  }

  if (!lastParam(url, 'sslmode')) {
    url.searchParams.set('sslmode', 'require')
  }

  if (!lastParam(url, 'uselibpqcompat')) {
    url.searchParams.set('uselibpqcompat', 'true')
  }

  // WHATWG drops the `@` of an empty userinfo (postgres://@/db), so restore the
  // placeholder without relying on it.
  const serialized = url.toString()
  return hasHost ? serialized : serialized.replace(`${placeholderHost}/`, '/')
}
