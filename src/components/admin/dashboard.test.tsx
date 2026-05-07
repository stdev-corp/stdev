import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen, within } from '@/tests/utils/render'
import { AdminDashboard } from '@/components/admin/dashboard'
import {
  makeBusiness,
  makeFileAsset,
  makeHistory,
  makeImageAsset,
  makeInstitution,
  makeMarkdown,
  makeReport,
  makeWebpage,
} from '@/tests/utils/fixtures'

function makeActions() {
  return {
    createBusiness: vi.fn(async () => {}),
    createFileAsset: vi.fn(async () => {}),
    createHistory: vi.fn(async () => {}),
    createImageAsset: vi.fn(async () => {}),
    createInstitution: vi.fn(async () => {}),
    createMarkdown: vi.fn(async () => {}),
    createReport: vi.fn(async () => {}),
    createWebpage: vi.fn(async () => {}),
    deleteBusiness: vi.fn(async () => {}),
    deleteFileAsset: vi.fn(async () => {}),
    deleteHistory: vi.fn(async () => {}),
    deleteImageAsset: vi.fn(async () => {}),
    deleteInstitution: vi.fn(async () => {}),
    deleteMarkdown: vi.fn(async () => {}),
    deleteReport: vi.fn(async () => {}),
    deleteWebpage: vi.fn(async () => {}),
    updateBusiness: vi.fn(async () => {}),
    updateFileAsset: vi.fn(async () => {}),
    updateHistory: vi.fn(async () => {}),
    updateImageAsset: vi.fn(async () => {}),
    updateInstitution: vi.fn(async () => {}),
    updateMarkdown: vi.fn(async () => {}),
    updateReport: vi.fn(async () => {}),
    updateWebpage: vi.fn(async () => {}),
  }
}

function defaultProps() {
  return {
    sessionEmail: 'admin@stdev.kr',
    businesses: [makeBusiness()],
    images: [makeImageAsset()],
    files: [makeFileAsset()],
    institutions: [makeInstitution()],
    markdowns: [makeMarkdown()],
    webpages: [makeWebpage()],
    reports: [makeReport()],
    histories: [makeHistory()],
    actions: makeActions(),
  }
}

function getUpdateForm(headingName: string): HTMLFormElement {
  const h3 = screen.getByRole('heading', { level: 3, name: headingName })
  const next = h3.nextElementSibling
  if (!(next instanceof HTMLFormElement)) {
    throw new Error(`Expected a <form> after h3 "${headingName}"`)
  }
  return next
}

function getCreateForm(sectionTitle: string): HTMLFormElement {
  const h2 = screen.getByRole('heading', { level: 2, name: sectionTitle })
  const section = h2.closest('section')
  if (!section) throw new Error(`No <section> for "${sectionTitle}"`)
  const form = section.querySelector('form')
  if (!form) throw new Error(`No <form> inside "${sectionTitle}" section`)
  return form
}

describe('<AdminDashboard>', () => {
  describe('header', () => {
    it('renders the "STDev DIY CMS" h1 heading', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      expect(
        screen.getByRole('heading', { level: 1, name: 'STDev DIY CMS' }),
      ).toBeInTheDocument()
    })

    it('renders the sessionEmail inside the login-status line', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      expect(
        screen.getByText('admin@stdev.kr 계정으로 로그인했습니다.'),
      ).toBeInTheDocument()
    })

    it('wraps everything inside a <main> landmark', () => {
      const { container } = renderWithChakra(
        <AdminDashboard {...defaultProps()} />,
      )
      expect(container.querySelector('main')).not.toBeNull()
    })
  })

  describe('데이터 counts summary', () => {
    it('renders the "현재 데이터" heading', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      expect(
        screen.getByRole('heading', { level: 2, name: '현재 데이터' }),
      ).toBeInTheDocument()
    })

    it('shows a count list item for every entity type', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      expect(screen.getByText('사업: 1')).toBeInTheDocument()
      expect(screen.getByText('이미지: 1')).toBeInTheDocument()
      expect(screen.getByText('파일: 1')).toBeInTheDocument()
      expect(screen.getByText('기관: 1')).toBeInTheDocument()
      expect(screen.getByText('마크다운: 1')).toBeInTheDocument()
      expect(screen.getByText('웹페이지: 1')).toBeInTheDocument()
      expect(screen.getByText('보고서: 1')).toBeInTheDocument()
      expect(screen.getByText('연혁: 1')).toBeInTheDocument()
    })

    it('reflects actual array lengths (2 businesses, 0 histories)', () => {
      const props = defaultProps()
      props.businesses = [
        makeBusiness({ id: 1 }),
        makeBusiness({ id: 2, name: 'Second', code: 'second' }),
      ]
      props.histories = []
      renderWithChakra(<AdminDashboard {...props} />)
      expect(screen.getByText('사업: 2')).toBeInTheDocument()
      expect(screen.getByText('연혁: 0')).toBeInTheDocument()
    })
  })

  describe('기존 데이터 관리 section', () => {
    it('renders the "기존 데이터 관리" section heading', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      expect(
        screen.getByRole('heading', { level: 2, name: '기존 데이터 관리' }),
      ).toBeInTheDocument()
    })

    it('renders all 8 h3 entity subsection headings', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const expected = [
        '사업',
        '이미지',
        '파일',
        '기관',
        '마크다운',
        '웹페이지',
        '보고서',
        '연혁',
      ]
      for (const name of expected) {
        expect(
          screen.getByRole('heading', { level: 3, name }),
        ).toBeInTheDocument()
      }
    })
  })

  describe('existing Business update form', () => {
    it('renders a hidden id input equal to the business id', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('사업')
      const hidden = form.querySelector(
        'input[name="id"]',
      ) as HTMLInputElement | null
      expect(hidden).not.toBeNull()
      expect(hidden?.type).toBe('hidden')
      expect(hidden?.value).toBe('1')
    })

    it('shows the "#1" id marker inside the form', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('사업')
      expect(within(form).getByText('#1')).toBeInTheDocument()
    })

    it('pre-fills name / code / location / startDate / endDate', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('사업')
      expect(
        (form.querySelector('input[name="name"]') as HTMLInputElement).value,
      ).toBe('Hackathon 2026')
      expect(
        (form.querySelector('input[name="code"]') as HTMLInputElement).value,
      ).toBe('hack-2026')
      expect(
        (form.querySelector('input[name="location"]') as HTMLInputElement)
          .value,
      ).toBe('Seoul')
      expect(
        (form.querySelector('input[name="startDate"]') as HTMLInputElement)
          .value,
      ).toBe('2026-06-01')
      expect(
        (form.querySelector('input[name="endDate"]') as HTMLInputElement).value,
      ).toBe('2026-06-02')
    })

    it('marks name/code/dates as required and location as optional', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('사업')
      expect(form.querySelector('input[name="name"]')).toHaveAttribute(
        'required',
      )
      expect(form.querySelector('input[name="code"]')).toHaveAttribute(
        'required',
      )
      expect(form.querySelector('input[name="startDate"]')).toHaveAttribute(
        'required',
      )
      expect(form.querySelector('input[name="endDate"]')).toHaveAttribute(
        'required',
      )
      expect(form.querySelector('input[name="location"]')).not.toHaveAttribute(
        'required',
      )
    })

    it('exposes both a 수정 submit button and a 삭제 button', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('사업')
      const update = within(form).getByRole('button', { name: '수정' })
      expect(update).toHaveAttribute('type', 'submit')
      expect(
        within(form).getByRole('button', { name: '삭제' }),
      ).toBeInTheDocument()
    })

    it('renders an empty string when location is null', () => {
      const props = defaultProps()
      props.businesses = [makeBusiness({ location: null })]
      renderWithChakra(<AdminDashboard {...props} />)
      const form = getUpdateForm('사업')
      expect(
        (form.querySelector('input[name="location"]') as HTMLInputElement)
          .value,
      ).toBe('')
    })
  })

  describe('existing ImageAsset update form', () => {
    it('pre-fills url / filename / alt / mimeType and exposes an image/* file input', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('이미지')
      expect(
        (form.querySelector('input[name="url"]') as HTMLInputElement).value,
      ).toBe('https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/logo.png')
      expect(form.querySelector('input[name="file"]')).toHaveAttribute(
        'accept',
        'image/*',
      )
      expect(form.querySelector('input[name="file"]')).toHaveAttribute(
        'type',
        'file',
      )
      expect(
        (form.querySelector('input[name="filename"]') as HTMLInputElement)
          .value,
      ).toBe('logo.png')
      expect(
        (form.querySelector('input[name="alt"]') as HTMLInputElement).value,
      ).toBe('Logo')
      expect(
        (form.querySelector('input[name="mimeType"]') as HTMLInputElement)
          .value,
      ).toBe('image/png')
    })

    it('renders empty strings when all nullable image fields are null', () => {
      const props = defaultProps()
      props.images = [
        makeImageAsset({
          alt: null,
          filename: null,
          url: null,
          mimeType: null,
        }),
      ]
      renderWithChakra(<AdminDashboard {...props} />)
      const form = getUpdateForm('이미지')
      expect(
        (form.querySelector('input[name="url"]') as HTMLInputElement).value,
      ).toBe('')
      expect(
        (form.querySelector('input[name="filename"]') as HTMLInputElement)
          .value,
      ).toBe('')
      expect(
        (form.querySelector('input[name="alt"]') as HTMLInputElement).value,
      ).toBe('')
      expect(
        (form.querySelector('input[name="mimeType"]') as HTMLInputElement)
          .value,
      ).toBe('')
    })
  })

  describe('existing FileAsset update form', () => {
    it('pre-fills url / filename / mimeType and accepts PDFs only', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('파일')
      expect(
        (form.querySelector('input[name="url"]') as HTMLInputElement).value,
      ).toBe(
        'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/files/report.pdf',
      )
      expect(form.querySelector('input[name="file"]')).toHaveAttribute(
        'accept',
        'application/pdf',
      )
      expect(form.querySelector('input[name="filename"]')).toHaveAttribute(
        'required',
      )
      expect(
        (form.querySelector('input[name="filename"]') as HTMLInputElement)
          .value,
      ).toBe('report.pdf')
      expect(
        (form.querySelector('input[name="mimeType"]') as HTMLInputElement)
          .value,
      ).toBe('application/pdf')
    })
  })

  describe('existing Institution update form', () => {
    it('pre-fills nameKo / nameEn / url and pre-selects logoId', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('기관')
      expect(
        (form.querySelector('input[name="nameKo"]') as HTMLInputElement).value,
      ).toBe('기관명')
      expect(
        (form.querySelector('input[name="nameEn"]') as HTMLInputElement).value,
      ).toBe('Institution')
      expect(
        (form.querySelector('input[name="url"]') as HTMLInputElement).value,
      ).toBe('https://example.com')
      const logoSelect = form.querySelector(
        'select[name="logoId"]',
      ) as HTMLSelectElement
      expect(logoSelect.value).toBe('1')
      expect(logoSelect).toHaveAttribute('required')
    })

    it('lists every available image as a logoId option', () => {
      const props = defaultProps()
      props.images = [
        makeImageAsset({ id: 1, filename: 'a.png' }),
        makeImageAsset({ id: 2, filename: 'b.png' }),
      ]
      renderWithChakra(<AdminDashboard {...props} />)
      const form = getUpdateForm('기관')
      const select = form.querySelector(
        'select[name="logoId"]',
      ) as HTMLSelectElement
      const options = Array.from(select.querySelectorAll('option'))
      expect(options).toHaveLength(2)
      expect(options[0].value).toBe('1')
      expect(options[0].textContent).toContain('a.png')
      expect(options[1].value).toBe('2')
      expect(options[1].textContent).toContain('b.png')
    })
  })

  describe('existing Markdown update form', () => {
    it('renders a type select with the three allowed options', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('마크다운')
      const select = form.querySelector(
        'select[name="type"]',
      ) as HTMLSelectElement
      expect(select.value).toBe('articles')
      const entries = Array.from(select.querySelectorAll('option')).map((o) => [
        o.value,
        o.textContent,
      ])
      expect(entries).toEqual([
        ['articles', '정관'],
        ['privacy', '개인정보처리방침'],
        ['terms', '이용약관'],
      ])
    })

    it('renders revisionDate/effectiveDate inputs and a content textarea', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('마크다운')
      expect(
        (form.querySelector('input[name="revisionDate"]') as HTMLInputElement)
          .value,
      ).toBe('2026-01-01')
      expect(
        (form.querySelector('input[name="effectiveDate"]') as HTMLInputElement)
          .value,
      ).toBe('2026-01-10')
      const ta = form.querySelector(
        'textarea[name="content"]',
      ) as HTMLTextAreaElement
      expect(ta).toBeInTheDocument()
      expect(ta.value).toBe('# 정관\n\n본문')
      expect(ta).toHaveAttribute('rows', '8')
      expect(ta).toHaveAttribute('required')
    })
  })

  describe('existing Webpage update form', () => {
    it('renders a type select with the three webpage kinds', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('웹페이지')
      const select = form.querySelector(
        'select[name="type"]',
      ) as HTMLSelectElement
      expect(select.value).toBe('blog_post')
      const entries = Array.from(select.querySelectorAll('option')).map((o) => [
        o.value,
        o.textContent,
      ])
      expect(entries).toEqual([
        ['blog_post', '블로그 포스트'],
        ['news_article', '신문 기사'],
        ['press_release', '보도 자료'],
      ])
    })

    it('pre-fills url / title / author / publishedDate', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('웹페이지')
      expect(
        (form.querySelector('input[name="url"]') as HTMLInputElement).value,
      ).toBe('https://blog.example.com/post')
      expect(
        (form.querySelector('input[name="title"]') as HTMLInputElement).value,
      ).toBe('블로그 글')
      expect(
        (form.querySelector('input[name="author"]') as HTMLInputElement).value,
      ).toBe('홍길동')
      expect(
        (form.querySelector('input[name="publishedDate"]') as HTMLInputElement)
          .value,
      ).toBe('2026-05-01')
    })

    it('defaults businessId to empty value when webpage.businessId is null', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('웹페이지')
      const select = form.querySelector(
        'select[name="businessId"]',
      ) as HTMLSelectElement
      expect(select.value).toBe('')
      expect(select.querySelector('option[value=""]')?.textContent).toBe(
        '관련 사업 없음',
      )
    })

    it('includes each business as a businessId option by name', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('웹페이지')
      const select = form.querySelector(
        'select[name="businessId"]',
      ) as HTMLSelectElement
      expect(select.querySelector('option[value="1"]')?.textContent).toBe(
        'Hackathon 2026',
      )
    })

    it('pre-selects businessId when webpage.businessId is set', () => {
      const props = defaultProps()
      props.webpages = [makeWebpage({ businessId: 1 })]
      renderWithChakra(<AdminDashboard {...props} />)
      const form = getUpdateForm('웹페이지')
      expect(
        (form.querySelector('select[name="businessId"]') as HTMLSelectElement)
          .value,
      ).toBe('1')
    })
  })

  describe('existing Report update form', () => {
    it('pre-fills title and publishedDate', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('보고서')
      expect(
        (form.querySelector('input[name="title"]') as HTMLInputElement).value,
      ).toBe('2026 1분기 회의록')
      expect(
        (form.querySelector('input[name="publishedDate"]') as HTMLInputElement)
          .value,
      ).toBe('2026-03-31')
    })

    it('offers meeting / donation options in the type select', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('보고서')
      const select = form.querySelector(
        'select[name="type"]',
      ) as HTMLSelectElement
      expect(select.value).toBe('meeting')
      const entries = Array.from(select.querySelectorAll('option')).map((o) => [
        o.value,
        o.textContent,
      ])
      expect(entries).toEqual([
        ['meeting', '총회 및 이사회'],
        ['donation', '기부금 모금액 및 활용실적'],
      ])
    })

    it('requires a fileId and lists existing files as options', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('보고서')
      const select = form.querySelector(
        'select[name="fileId"]',
      ) as HTMLSelectElement
      expect(select).toHaveAttribute('required')
      expect(select.value).toBe('1')
      expect(select.querySelector('option[value="1"]')?.textContent).toContain(
        'report.pdf',
      )
    })
  })

  describe('existing History update form', () => {
    it('pre-fills date / title / content', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('연혁')
      expect(
        (form.querySelector('input[name="date"]') as HTMLInputElement).value,
      ).toBe('2026-05-01')
      expect(
        (form.querySelector('input[name="title"]') as HTMLInputElement).value,
      ).toBe('첫 이사회')
      expect(
        (form.querySelector('textarea[name="content"]') as HTMLTextAreaElement)
          .value,
      ).toBe('정관 채택')
    })

    it('renders an imageId select with an empty option and image options', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('연혁')
      const select = form.querySelector(
        'select[name="imageId"]',
      ) as HTMLSelectElement
      expect(select.value).toBe('')
      expect(select.querySelector('option[value=""]')?.textContent).toBe(
        '이미지 없음',
      )
      expect(select.querySelector('option[value="1"]')?.textContent).toContain(
        'logo.png',
      )
    })

    it('pre-selects imageId when history.imageId is set', () => {
      const props = defaultProps()
      props.histories = [makeHistory({ imageId: 1 })]
      renderWithChakra(<AdminDashboard {...props} />)
      const form = getUpdateForm('연혁')
      expect(
        (form.querySelector('select[name="imageId"]') as HTMLSelectElement)
          .value,
      ).toBe('1')
    })

    it('renders an empty content textarea when history.content is null', () => {
      const props = defaultProps()
      props.histories = [makeHistory({ content: null })]
      renderWithChakra(<AdminDashboard {...props} />)
      const form = getUpdateForm('연혁')
      expect(
        (form.querySelector('textarea[name="content"]') as HTMLTextAreaElement)
          .value,
      ).toBe('')
    })
  })

  describe('create forms', () => {
    it('renders all 8 create-section h2 headings', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const titles = [
        '사업 추가',
        '이미지 추가',
        'PDF 파일 추가',
        '기관 추가',
        '마크다운 추가',
        '웹페이지 추가',
        '보고서 추가',
        '연혁 추가',
      ]
      for (const t of titles) {
        expect(
          screen.getByRole('heading', { level: 2, name: t }),
        ).toBeInTheDocument()
      }
    })

    it('business create form has placeholders, empty defaults, and a 저장 submit', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('사업 추가')
      expect(form.querySelector('input[name="name"]')).toHaveAttribute(
        'placeholder',
        '이름',
      )
      expect(form.querySelector('input[name="code"]')).toHaveAttribute(
        'placeholder',
        '코드',
      )
      expect(form.querySelector('input[name="location"]')).toHaveAttribute(
        'placeholder',
        '장소',
      )
      expect(
        (form.querySelector('input[name="name"]') as HTMLInputElement).value,
      ).toBe('')
      const save = within(form).getByRole('button', { name: '저장' })
      expect(save).toHaveAttribute('type', 'submit')
    })

    it('image create form accepts image/* and has Korean placeholders', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('이미지 추가')
      expect(form.querySelector('input[name="file"]')).toHaveAttribute(
        'accept',
        'image/*',
      )
      expect(form.querySelector('input[name="url"]')).toHaveAttribute(
        'placeholder',
        '기존 S3 이미지 URL (선택)',
      )
      expect(form.querySelector('input[name="alt"]')).toHaveAttribute(
        'placeholder',
        '대체 텍스트',
      )
      expect(form.querySelector('input[name="mimeType"]')).toHaveAttribute(
        'placeholder',
        'MIME 타입',
      )
    })

    it('PDF file create form accepts application/pdf and has S3 URL placeholder', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('PDF 파일 추가')
      expect(form.querySelector('input[name="file"]')).toHaveAttribute(
        'accept',
        'application/pdf',
      )
      expect(form.querySelector('input[name="url"]')).toHaveAttribute(
        'placeholder',
        '기존 S3 PDF URL (선택)',
      )
    })

    it('institution create form has required logoId select with placeholder option', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('기관 추가')
      const select = form.querySelector(
        'select[name="logoId"]',
      ) as HTMLSelectElement
      expect(select).toHaveAttribute('required')
      expect(select.querySelector('option[value=""]')?.textContent).toBe(
        '로고 이미지 선택',
      )
      expect(select.querySelector('option[value="1"]')).not.toBeNull()
    })

    it('markdown create form has required type/dates and a 10-row content textarea', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('마크다운 추가')
      expect(form.querySelector('select[name="type"]')).toHaveAttribute(
        'required',
      )
      expect(form.querySelector('input[name="revisionDate"]')).toHaveAttribute(
        'required',
      )
      expect(form.querySelector('input[name="effectiveDate"]')).toHaveAttribute(
        'required',
      )
      const ta = form.querySelector(
        'textarea[name="content"]',
      ) as HTMLTextAreaElement
      expect(ta).toHaveAttribute('required')
      expect(ta).toHaveAttribute('rows', '10')
      expect(ta).toHaveAttribute('placeholder', '내용')
    })

    it('webpage create form has 3 type options and an optional businessId select', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('웹페이지 추가')
      const typeSel = form.querySelector(
        'select[name="type"]',
      ) as HTMLSelectElement
      expect(typeSel.querySelectorAll('option')).toHaveLength(3)
      expect(typeSel).toHaveAttribute('required')
      const bizSel = form.querySelector(
        'select[name="businessId"]',
      ) as HTMLSelectElement
      expect(bizSel).not.toHaveAttribute('required')
      expect(bizSel.querySelector('option[value=""]')?.textContent).toBe(
        '관련 사업 없음',
      )
    })

    it('report create form has required type/title/publishedDate/fileId', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('보고서 추가')
      expect(form.querySelector('select[name="type"]')).toHaveAttribute(
        'required',
      )
      expect(form.querySelector('input[name="title"]')).toHaveAttribute(
        'placeholder',
        '제목',
      )
      expect(form.querySelector('input[name="publishedDate"]')).toHaveAttribute(
        'required',
      )
      const fileSel = form.querySelector(
        'select[name="fileId"]',
      ) as HTMLSelectElement
      expect(fileSel).toHaveAttribute('required')
      expect(fileSel.querySelector('option[value=""]')?.textContent).toBe(
        'PDF 선택',
      )
    })

    it('history create form has required date/title, optional 5-row content textarea, optional imageId', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('연혁 추가')
      expect(form.querySelector('input[name="date"]')).toHaveAttribute(
        'required',
      )
      expect(form.querySelector('input[name="title"]')).toHaveAttribute(
        'required',
      )
      expect(form.querySelector('input[name="title"]')).toHaveAttribute(
        'placeholder',
        '제목',
      )
      const ta = form.querySelector(
        'textarea[name="content"]',
      ) as HTMLTextAreaElement
      expect(ta).not.toHaveAttribute('required')
      expect(ta).toHaveAttribute('rows', '5')
      const imgSel = form.querySelector(
        'select[name="imageId"]',
      ) as HTMLSelectElement
      expect(imgSel).not.toHaveAttribute('required')
      expect(imgSel.querySelector('option[value=""]')?.textContent).toBe(
        '이미지 없음',
      )
    })
  })

  describe('empty lists', () => {
    it('renders 0 for all counts and no update forms when every array is empty', () => {
      const props = {
        ...defaultProps(),
        businesses: [],
        images: [],
        files: [],
        institutions: [],
        markdowns: [],
        webpages: [],
        reports: [],
        histories: [],
      }
      const { container } = renderWithChakra(<AdminDashboard {...props} />)
      for (const label of [
        '사업',
        '이미지',
        '파일',
        '기관',
        '마크다운',
        '웹페이지',
        '보고서',
        '연혁',
      ]) {
        expect(screen.getByText(`${label}: 0`)).toBeInTheDocument()
      }
      expect(container.querySelectorAll('form')).toHaveLength(8)
      expect(screen.queryAllByRole('button', { name: '수정' })).toHaveLength(0)
      expect(screen.queryAllByRole('button', { name: '삭제' })).toHaveLength(0)
    })

    it('renders exactly 16 forms when every entity has a single record', () => {
      const { container } = renderWithChakra(
        <AdminDashboard {...defaultProps()} />,
      )
      expect(container.querySelectorAll('form')).toHaveLength(16)
    })

    it('empty businesses keeps webpage businessId select with only the empty option', () => {
      const props = defaultProps()
      props.businesses = []
      renderWithChakra(<AdminDashboard {...props} />)
      const createForm = getCreateForm('웹페이지 추가')
      const select = createForm.querySelector(
        'select[name="businessId"]',
      ) as HTMLSelectElement
      expect(select.querySelectorAll('option')).toHaveLength(1)
      expect(select.querySelector('option[value=""]')?.textContent).toBe(
        '관련 사업 없음',
      )
    })
  })

  describe('aggregated button counts', () => {
    it('has exactly 8 수정 submit buttons (one per update form)', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      expect(screen.getAllByRole('button', { name: '수정' })).toHaveLength(8)
    })

    it('has exactly 8 삭제 buttons (one per update form)', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      expect(screen.getAllByRole('button', { name: '삭제' })).toHaveLength(8)
    })

    it('has exactly 8 저장 submit buttons (one per create form)', () => {
      renderWithChakra(<AdminDashboard {...defaultProps()} />)
      expect(screen.getAllByRole('button', { name: '저장' })).toHaveLength(8)
    })
  })

  describe('user interactions', () => {
    it('allows typing into the business create name input', async () => {
      const { user } = renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('사업 추가')
      const input = form.querySelector('input[name="name"]') as HTMLInputElement
      await user.type(input, '새 사업')
      expect(input.value).toBe('새 사업')
    })

    it('allows selecting a different markdown type in the create form', async () => {
      const { user } = renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('마크다운 추가')
      const select = form.querySelector(
        'select[name="type"]',
      ) as HTMLSelectElement
      await user.selectOptions(select, 'privacy')
      expect(select.value).toBe('privacy')
    })

    it('allows typing into the history create title input', async () => {
      const { user } = renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getCreateForm('연혁 추가')
      const input = form.querySelector(
        'input[name="title"]',
      ) as HTMLInputElement
      await user.type(input, '새 연혁')
      expect(input.value).toBe('새 연혁')
    })

    it('allows overwriting the business update name input', async () => {
      const { user } = renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('사업')
      const input = form.querySelector('input[name="name"]') as HTMLInputElement
      await user.clear(input)
      await user.type(input, 'Renamed')
      expect(input.value).toBe('Renamed')
    })

    it('allows switching a webpage update businessId from empty to the first business', async () => {
      const { user } = renderWithChakra(<AdminDashboard {...defaultProps()} />)
      const form = getUpdateForm('웹페이지')
      const select = form.querySelector(
        'select[name="businessId"]',
      ) as HTMLSelectElement
      expect(select.value).toBe('')
      await user.selectOptions(select, '1')
      expect(select.value).toBe('1')
    })
  })
})
