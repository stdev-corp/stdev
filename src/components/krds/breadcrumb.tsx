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
              <span className="txt" aria-current="page">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
