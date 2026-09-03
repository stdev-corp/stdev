'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveBreadcrumb } from '@/utils/breadcrumb'

export default function Breadcrumb() {
  const pathname = usePathname()
  const crumbs = resolveBreadcrumb(pathname ?? '/')

  return (
    <nav
      className="krds-breadcrumb-wrap"
      aria-label="현재 경로"
      id="breadcrumb"
    >
      <ol className="breadcrumb">
        {crumbs.map((crumb, index) => (
          <li key={crumb.label} className={index === 0 ? 'home' : undefined}>
            {crumb.href ? (
              <Link href={crumb.href} className="txt">
                {crumb.label}
              </Link>
            ) : (
              // 링크 없는 중간 구역(안내 및 공시)도 있으므로 현재 페이지 표시는
              // 마지막 항목에만 붙인다.
              <span
                className="txt"
                aria-current={index === crumbs.length - 1 ? 'page' : undefined}
              >
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
