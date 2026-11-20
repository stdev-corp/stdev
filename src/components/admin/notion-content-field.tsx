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
import { useState, type CSSProperties } from 'react'
import NotionMarkdown from '@/components/notion/notion-markdown'

type Props = {
  name: string
  label: string
  defaultValue: string
  required?: boolean
  rows?: number
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
  ['글자 색', ':color[글자]{c="red"}  /  :u[밑줄]  /  표 칸 줄바꿈 :br{}'],
  [
    '표 머리글',
    ':::table{header-row=false header-column=true}\n| 가 | 나 |\n|---|---|\n:::',
  ],
  [
    '기타',
    '::toc (목차)  /  ::video{src="URL"}  /  ::embed{src="지도·유튜브 URL"}',
  ],
]

const COLORS =
  'default, gray, brown, orange, yellow, green, blue, purple, pink, red (배경색은 뒤에 _background)'

// 공개 페이지(KRDS 루트 10px)와 같은 16px 본문으로 보이도록 기준 크기를 준다.
const previewStyle = { '--notion-font-size': '16px' } as CSSProperties

/**
 * 노션 확장 마크다운 입력란. 미리보기는 공개 페이지와 같은 렌더러로 그린다.
 * 하위 페이지 링크(::page)는 저장 후 공개 페이지에서만 제목이 채워진다.
 */
export function NotionContentField({
  name,
  label,
  defaultValue,
  required,
  rows = 18,
}: Props) {
  const [value, setValue] = useState(defaultValue)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <Field.Root required={required}>
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
            onClick={() => setMode('preview')}
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
          <div className="notion-page" style={previewStyle}>
            <NotionMarkdown content={value} openLinksInNewTab />
          </div>
        </Box>
      )}
    </Field.Root>
  )
}
