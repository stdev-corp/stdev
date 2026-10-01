import { describe, expect, it } from 'vitest'
import { withDatabaseSslParams } from '@/utils/database-url'

const rds = 'postgres://u:p@db.abc.ap-northeast-2.rds.amazonaws.com:5432/stdev'

describe('withDatabaseSslParams', () => {
  it('adds libpq-style sslmode=require to an RDS host', () => {
    expect(withDatabaseSslParams(rds)).toBe(
      `${rds}?sslmode=require&uselibpqcompat=true`,
    )
  })

  it('keeps an sslmode the URL already sets', () => {
    expect(withDatabaseSslParams(`${rds}?sslmode=verify-full`)).toBe(
      `${rds}?sslmode=verify-full&uselibpqcompat=true`,
    )
  })

  it('keeps a uselibpqcompat the URL already sets', () => {
    expect(withDatabaseSslParams(`${rds}?uselibpqcompat=false`)).toBe(
      `${rds}?uselibpqcompat=false&sslmode=require`,
    )
  })

  it('leaves non-RDS hosts untouched', () => {
    const local = 'postgresql://stdev:stdev@127.0.0.1:5433/stdev_test'
    expect(withDatabaseSslParams(local)).toBe(local)
  })

  it('returns an unparseable URL as-is', () => {
    const placeholder = 'postgres://user:password@url:port/schema'
    expect(withDatabaseSslParams(placeholder)).toBe(placeholder)
  })
})
