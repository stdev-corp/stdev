import { describe, expect, it } from 'vitest'
import { withDatabaseSslParams } from '@/utils/database-url'

const rds = 'postgres://u:p@db.abc.ap-northeast-2.rds.amazonaws.com:5432/stdev'
const remote = 'postgres://u:p@db.example.org:5432/stdev'

describe('withDatabaseSslParams', () => {
  it.each([
    ['an RDS endpoint', rds],
    ['a custom domain', remote],
    ['a private IP', 'postgres://u:p@10.0.1.5:5432/stdev'],
    ['a leading-zero IPv4 spelling', 'postgres://u:p@0177.0.0.1:5432/stdev'],
  ])('adds libpq-style sslmode=require for %s', (_, databaseUrl) => {
    expect(withDatabaseSslParams(databaseUrl)).toBe(
      `${databaseUrl}?sslmode=require&uselibpqcompat=true`,
    )
  })

  it('keeps an sslmode an RDS URL already sets', () => {
    expect(withDatabaseSslParams(`${rds}?sslmode=disable`)).toBe(
      `${rds}?sslmode=disable&uselibpqcompat=true`,
    )
  })

  it('keeps a uselibpqcompat an RDS URL already sets', () => {
    expect(withDatabaseSslParams(`${rds}?uselibpqcompat=false`)).toBe(
      `${rds}?uselibpqcompat=false&sslmode=require`,
    )
  })

  it.each([
    [
      'an empty sslmode',
      `${remote}?sslmode=`,
      `${remote}?sslmode=require&uselibpqcompat=true`,
    ],
    [
      'an empty ssl',
      `${remote}?ssl=`,
      `${remote}?ssl=&sslmode=require&uselibpqcompat=true`,
    ],
    [
      'an empty uselibpqcompat on RDS',
      `${rds}?sslmode=require&uselibpqcompat=`,
      `${rds}?sslmode=require&uselibpqcompat=true`,
    ],
    [
      'an empty ?host=',
      `${remote}?host=`,
      `${remote}?host=&sslmode=require&uselibpqcompat=true`,
    ],
  ])('treats %s as unset', (_, databaseUrl, expected) => {
    expect(withDatabaseSslParams(databaseUrl)).toBe(expected)
  })

  it.each([
    [
      'the last sslmode, which is empty',
      `${remote}?sslmode=require&sslmode=`,
      `${remote}?sslmode=require&uselibpqcompat=true`,
    ],
    ['the last ssl', `${remote}?ssl=&ssl=true`, `${remote}?ssl=&ssl=true`],
    [
      'the last host, which is remote',
      `${remote}?host=localhost&host=db.example.org`,
      `${remote}?host=localhost&host=db.example.org&sslmode=require&uselibpqcompat=true`,
    ],
    [
      'the last host, which is local',
      `${remote}?host=db.example.org&host=localhost`,
      `${remote}?host=db.example.org&host=localhost`,
    ],
  ])('reads a repeated key by %s, as pg does', (_, databaseUrl, expected) => {
    expect(withDatabaseSslParams(databaseUrl)).toBe(expected)
  })

  it.each([
    'postgresql://stdev:stdev@127.0.0.1:5433/stdev_test',
    'postgres://u:p@localhost:5432/stdev',
    'postgres://u:p@[::1]:5432/stdev',
    'postgres://u:p@LOCALHOST:5432/stdev',
    'postgres:///stdev',
    'postgres://u:p@127.1:5432/stdev',
    'postgres://u:p@127.0.0.2:5432/stdev',
    'postgres://u:p@0x7f.1:5432/stdev',
    'postgres://u:p@[0:0:0:0:0:0:0:1]:5432/stdev',
    'postgres://u:p@localhost.:5432/stdev',
    'postgres://u:p@db.localhost:5432/stdev',
    'postgres://u:p@0.0.0.0:5432/stdev',
    'postgres://u:p@[::]:5432/stdev',
    'postgresql:///stdev?host=::1',
    'postgres://u:p@db.example.org:5432/stdev?host=::ffff:127.0.0.1',
    'postgresql:///stdev?host=::ffff:7f00:1',
    'postgres://u:p@[::ffff:127.0.0.1]:5432/stdev',
    'postgres://u:p@[::ffff:0.0.0.0]:5432/stdev',
    'postgresql:///stdev?host=/var/run/postgresql',
    'postgres://u@%2Fvar%2Frun%2Fpostgresql/stdev',
  ])('leaves the local database %s untouched', (databaseUrl) => {
    expect(withDatabaseSslParams(databaseUrl)).toBe(databaseUrl)
  })

  it.each([
    'postgresql:///stdev?host=db.example.org',
    'postgres://u:p@localhost:5432/stdev?host=db.example.org',
  ])('follows the remote ?host= of %s', (databaseUrl) => {
    expect(withDatabaseSslParams(databaseUrl)).toBe(
      `${databaseUrl}&sslmode=require&uselibpqcompat=true`,
    )
  })

  it.each([
    'ssl=true',
    'ssl=0',
    'sslmode=require',
    'sslmode=no-verify',
    'sslmode=verify-ca&sslrootcert=/certs/ca.pem',
    'sslrootcert=/certs/ca.pem',
    'sslcert=/certs/client.pem&sslkey=/certs/client.key',
  ])('keeps the non-RDS URL that sets %s as it is', (query) => {
    expect(withDatabaseSslParams(`${remote}?${query}`)).toBe(
      `${remote}?${query}`,
    )
  })

  it.each([
    ['an RDS URL', `${rds}?ssl=true`],
    [
      'an upper-case RDS URL',
      'postgres://u:p@DB.ABC.AP-NORTHEAST-2.RDS.AMAZONAWS.COM:5432/stdev?ssl=true',
    ],
  ])('still adds require to %s that sets ssl', (_, databaseUrl) => {
    expect(withDatabaseSslParams(databaseUrl)).toBe(
      `${databaseUrl}&sslmode=require&uselibpqcompat=true`,
    )
  })

  it.each([
    [
      'a malformed percent-encoded host',
      'postgres://u@db%E0%A4%A.example.org/stdev',
    ],
    ['a host only postgres: accepts', 'postgresql:///stdev?host=DB%20HOST'],
    [
      'an IPv4-mapped address outside 127/8',
      'postgresql:///stdev?host=::ffff:10.0.1.5',
    ],
  ])('treats %s as remote', (_, databaseUrl) => {
    const { searchParams } = new URL(withDatabaseSslParams(databaseUrl))
    expect(searchParams.get('sslmode')).toBe('require')
    expect(searchParams.get('uselibpqcompat')).toBe('true')
  })

  it('returns an unparseable URL as-is', () => {
    const placeholder = 'postgres://user:password@url:port/schema'
    expect(withDatabaseSslParams(placeholder)).toBe(placeholder)
  })
})
