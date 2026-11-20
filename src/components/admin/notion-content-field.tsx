'use client'

import {
  Box,
  Button,
  Code,
  Field,
  Flex,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useRef, useState, type CSSProperties } from 'react'
import NotionMarkdown from '@/components/notion/notion-markdown'
import type { NotionPageLinks } from '@/utils/cms-types'

export type PreviewPageLinks = (
  businessId: number | null,
  content: string,
) => Promise<NotionPageLinks>

type Props = {
  name: string
  label: string
  defaultValue: string
  required?: boolean
  rows?: number
  /** 미리보기에서 ::page 링크의 제목·주소를 채우는 서버 액션 */
  resolvePageLinks?: PreviewPageLinks
  /** 같은 폼에서 기준 행사 ID를 읽을 입력 이름('id' 또는 'businessId') */
  businessIdField?: string
}

const SYNTAX_HELP: [string, string][] = [
  ['제목', '# 제목 1 / ## 제목 2 / ### 제목 3'],
  ['콜아웃', ':::callout{icon="💡" color="gray_background"}\n내용\n:::'],
  ['토글', ':::toggle[질문]\n답변\n:::'],
  [
    '하위 페이지 링크',
    '::page{path="faq"}  /  ::page{event="dsf26" path="faq"}',
  ],
  [
    '이미지',
    '![설명](이미지 URL)  /  ::image{src="URL" width=240 caption="캡션"}',
  ],
  ['북마크', '::bookmark{url="https://…" title="제목" description="설명"}'],
  [
    '단 나누기',
    '::::columns\n:::column{ratio=0.5}\n왼쪽\n:::\n:::column{ratio=0.5}\n오른쪽\n:::\n::::',
  ],
  [
    '글자 꾸미기',
    ':color[글자]{c="red"}  /  :u[밑줄]  /  표 칸 줄바꿈 :br{}\n:b[굵게]  /  :i[기울임]  /  :s[취소선]  (**·*·~~가 한글 문장부호와 붙어 풀릴 때)',
  ],
  ['색 블록', ':::color{c="gray_background"}\n내용\n:::'],
  ['들여쓰기', ':::indent\n들여쓴 내용\n:::'],
  [
    '표 머리글·열 폭',
    ':::table{header-row=false header-column=true widths="120,373"}\n| 가 | 나 |\n|---|---|\n:::',
  ],
  [
    '데이터베이스 표',
    ':::database[제목]\n| 이름 | 날짜 |\n|---|---|\n| 항목 | 2026년 4월 18일 |\n:::',
  ],
  [
    '갤러리(카드 목록)',
    ':::gallery{size="small"}\n- ![표지](이미지 URL "cover:30%")\\\n  [카드 제목](/hackathon/…)\n:::\n("cover:N%"는 카드 표지에서 보일 세로 위치, 빼면 가운데)',
  ],
  [
    '기타',
    '::toc (목차)  /  ::video{src="URL" width=144}  /  ::embed{src="지도·유튜브 URL"}',
  ],
]

const COLORS =
  'default, gray, brown, orange, yellow, green, blue, purple, pink, red (배경색은 뒤에 _background)'

// 공개 페이지(KRDS 루트 10px)와 같은 16px 본문으로 보이도록 기준 크기를 준다.
const previewStyle = { '--notion-font-size': '16px' } as CSSProperties

/**
 * 노션 확장 마크다운 입력란. 미리보기는 공개 페이지와 같은 렌더러로 그린다.
 * 하위 페이지 링크(::page)는 미리보기를 열 때 지금 DB의 하위 페이지로 풀고, 찾지
 * 못한 링크는 '찾을 수 없는 하위 페이지'로 표시한다.
 */
export function NotionContentField({
  name,
  label,
  defaultValue,
  required,
  rows = 18,
  resolvePageLinks,
  businessIdField,
}: Props) {
  const [value, setValue] = useState(defaultValue)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [helpOpen, setHelpOpen] = useState(false)
  // null이면 아직 링크를 푸는 중이다.
  const [pageLinks, setPageLinks] = useState<NotionPageLinks | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const request = useRef(0)

  async function openPreview() {
    setMode('preview')
    if (!resolvePageLinks) {
      setPageLinks({})
      return
    }
    setPageLinks(null)
    const field = businessIdField
      ? rootRef.current?.closest('form')?.elements.namedItem(businessIdField)
      : null
    const id = Number(
      field instanceof HTMLInputElement || field instanceof HTMLSelectElement
        ? field.value
        : '',
    )
    const current = ++request.current
    let links: NotionPageLinks = {}
    try {
      links = await resolvePageLinks(
        Number.isInteger(id) && id > 0 ? id : null,
        value,
      )
    } catch {
      // 링크를 못 풀어도 미리보기는 보여 준다(링크는 '찾을 수 없음'으로 표시).
    }
    if (current === request.current) {
      setPageLinks(links)
    }
  }

  return (
    <Field.Root required={required} ref={rootRef}>
      <Flex justify="space-between" align="center" w="full" gap={2} wrap="wrap">
        <Field.Label>{label}</Field.Label>
        <Flex gap={2}>
          <Button
            size="xs"
            variant={mode === 'edit' ? 'solid' : 'outline'}
            onClick={() => setMode('edit')}
          >
            편집
          </Button>
          <Button
            size="xs"
            variant={mode === 'preview' ? 'solid' : 'outline'}
            onClick={openPreview}
          >
            미리보기
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setHelpOpen(!helpOpen)}
          >
            {helpOpen ? '문법 닫기' : '문법 보기'}
          </Button>
        </Flex>
      </Flex>
      {helpOpen && (
        <Stack
          gap={2}
          w="full"
          p={3}
          borderWidth="1px"
          borderRadius="md"
          bg="gray.50"
          fontSize="xs"
        >
          <Text>마크다운(GFM)에 아래 노션 블록 문법을 더해 씁니다.</Text>
          {SYNTAX_HELP.map(([title, example]) => (
            <Box key={title}>
              <Text fontWeight="semibold">{title}</Text>
              <Code whiteSpace="pre-wrap" display="block" p={1}>
                {example}
              </Code>
            </Box>
          ))}
          <Text>색상: {COLORS}</Text>
        </Stack>
      )}
      <Textarea
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        required={required}
        fontFamily="mono"
        fontSize="sm"
        hidden={mode !== 'edit'}
      />
      {mode === 'preview' && (
        <Box
          w="full"
          maxH="70vh"
          overflowY="auto"
          p={4}
          borderWidth="1px"
          borderRadius="md"
          bg="white"
          data-testid={`${name}-preview`}
        >
          {pageLinks === null && (
            <Text fontSize="xs" color="gray.500" mb={2}>
              하위 페이지 링크를 불러오는 중…
            </Text>
          )}
          <div className="notion-page" style={previewStyle}>
            <NotionMarkdown
              content={value}
              openLinksInNewTab
              pageLinks={pageLinks ?? {}}
              showMissingPageLinks={pageLinks !== null}
            />
          </div>
        </Box>
      )}
    </Field.Root>
  )
}
