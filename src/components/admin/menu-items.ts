export type AdminMenuItem = {
  label: string
  href: string
}

export const adminMenuItems: AdminMenuItem[] = [
  { label: '대시보드', href: '/admin' },
  { label: '사업', href: '/admin/businesses' },
  { label: '이미지', href: '/admin/images' },
  { label: '파일', href: '/admin/files' },
  { label: '기관', href: '/admin/institutions' },
  { label: '마크다운', href: '/admin/markdowns' },
  { label: '웹페이지', href: '/admin/webpages' },
  { label: '보고서', href: '/admin/reports' },
  { label: '연혁', href: '/admin/histories' },
  { label: '설정', href: '/admin/settings' },
  { label: 'AWS', href: '/admin/aws' },
]
