import { describe, expect, it } from 'vitest'
import { withDatabaseSslParams } from '@/utils/database-url'

const rds = 'postgres://u:p@db.abc.ap-northeast-2.rds.amazonaws.com:5432/stdev'

describe('withDatabaseSslParams', () => {
  it.each([
    ['an RDS endpoint', rds],
    ['a custom domain', 'postgres://u:p@db.example.org:5432/stdev'],
    ['a private IP', 'postgres://u:p@10.0.1.5:5432/stdev'],
  ])('adds libpq-style sslmode=require for %s', (_, databaseUrl) => {
    expect(withDatabaseSslParams(databaseUrl)).toBe(
      `${databaseUrl}?sslmode=require&uselibpqcompat=true`,
    )
  })

  it('keeps an sslmode the URL already sets', () => {
    expect(withDatabaseSslParams(`${rds}?sslmode=disable`)).toBe(
      `${rds}?sslmode=disable&uselibpqcompat=true`,
    )
  })

  it('keeps a uselibpqcompat the URL already sets', () => {
    expect(withDatabaseSslParams(`${rds}?uselibpqcompat=false`)).toBe(
      `${rds}?uselibpqcompat=false&sslmode=require`,
    )
  })

  it.each([
    'postgresql://stdev:stdev@127.0.0.1:5433/stdev_test',
    'postgres://u:p@localhost:5432/stdev',
    'postgres://u:p@[::1]:5432/stdev',
    'postgres:///stdev',
  ])('leaves the local database %s untouched', (databaseUrl) => {
    expect(withDatabaseSslParams(databaseUrl)).toBe(databaseUrl)
  })

  it('returns an unparseable URL as-is', () => {
    const placeholder = 'postgres://user:password@url:port/schema'
    expect(withDatabaseSslParams(placeholder)).toBe(placeholder)
  })
})
