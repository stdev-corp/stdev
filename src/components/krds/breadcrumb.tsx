'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveBreadcrumb, type Crumb } from '@/utils/breadcrumb'

type Props = {
  /** 메뉴에 없는 하위 페이지(행사 페이지 등)의 경로. 마지막이 현재 페이지. */
  trail?: Crumb[]
}

export default function Breadcrumb({ trail }: Props = {}) {
  const pathname = usePathname()
  const crumbs = resolveBreadcrumb(pathname ?? '/', trail)

  return (
    <nav
      className="krds-breadcrumb-wrap"
      aria-label="현재 경로"
      id="breadcrumb"
    >
      <ol className="breadcrumb">
        {crumbs.map((crumb, index) => (
          <li
            key={`${index}-${crumb.label}`}
            className={index === 0 ? 'home' : undefined}
          >
            {crumb.href ? (
              <Link href={crumb.href} className="txt">
                {crumb.label}
              </Link>
            ) : (
              // 구역 항목은 자체 페이지가 없어 링크 없이 그려지므로, 현재 페이지
              // 표시는 마지막 항목에만 붙인다.
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
