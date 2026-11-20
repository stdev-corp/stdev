import type { ReactNode } from 'react'
import { NotionIcon } from '@/components/notion/notion-markdown'
import { responsiveImage } from '@/utils/responsive-image'

type Props = {
  title: string
  icon: string | null
  coverImageUrl: string | null
  children: ReactNode
}

/**
 * 노션 페이지의 머리(커버, 아이콘, 제목)와 본문 틀. 페이지의 유일한 h1은
 * 노션 제목이 가진다.
 */
export default function NotionPage(props: Props) {
  return (
    <article className="notion-page">
      {props.coverImageUrl && (
        <div className="notion-cover">
          {/* 커버는 본문 폭에 맞춰 잘라 보이는 배너라 원본 비율을 알 필요가 없다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img {...responsiveImage(props.coverImageUrl)} alt="" />
        </div>
      )}
      <NotionIcon icon={props.icon} className="notion-page-icon" />
      <h1 className="notion-title">{props.title}</h1>
      {props.children}
    </article>
  )
}
