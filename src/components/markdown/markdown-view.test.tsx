import { describe, expect, it } from 'vitest'
import { renderAsyncServerComponent, screen } from '@/tests/utils/render'
import MarkdownView from '@/components/markdown/markdown-view'

describe('<MarkdownView>', () => {
  it('renders without crashing for empty content', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '' }),
    )
    expect(container).toBeInTheDocument()
    expect(container.querySelectorAll('h1, h2, h3, h4, h5, h6').length).toBe(0)
  })

  it('demotes h1 markdown to level 2 so the page keeps one h1', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '# H1 Title' }),
    )
    const heading = screen.getByRole('heading', { name: 'H1 Title', level: 2 })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H2')
    expect(container.querySelector('h1')).toBeNull()
  })

  it('demotes h2 markdown to level 3 so the page keeps one h1', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '## H2 Title' }),
    )
    const heading = screen.getByRole('heading', { name: 'H2 Title', level: 3 })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H3')
    expect(container.querySelector('h1')).toBeNull()
  })

  it('demotes h3 markdown to level 4 so the page keeps one h1', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '### H3 Title' }),
    )
    const heading = screen.getByRole('heading', { name: 'H3 Title', level: 4 })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H4')
    expect(container.querySelector('h1')).toBeNull()
  })

  it('demotes h4 markdown to level 5 so the page keeps one h1', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '#### H4 Title' }),
    )
    const heading = screen.getByRole('heading', { name: 'H4 Title', level: 5 })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H5')
    expect(container.querySelector('h1')).toBeNull()
  })

  it('demotes h5 markdown to level 6 so the page keeps one h1', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '##### H5 Title' }),
    )
    const heading = screen.getByRole('heading', { name: 'H5 Title', level: 6 })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H6')
    expect(container.querySelector('h1')).toBeNull()
  })

  it('keeps h6 markdown at level 6', async () => {
    await renderAsyncServerComponent(() =>
      MarkdownView({ content: '###### H6 Title' }),
    )
    const heading = screen.getByRole('heading', { name: 'H6 Title', level: 6 })
    expect(heading.tagName).toBe('H6')
  })

  it('renders paragraph text', async () => {
    await renderAsyncServerComponent(() =>
      MarkdownView({ content: 'Just a paragraph line.' }),
    )
    expect(screen.getByText('Just a paragraph line.')).toBeInTheDocument()
  })

  it('renders bold text with <strong>', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: 'hello **bolded** world' }),
    )
    const strong = container.querySelector('strong')
    expect(strong).not.toBeNull()
    expect(strong?.textContent).toBe('bolded')
  })

  it('renders italic text with <em>', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: 'hello *italic* world' }),
    )
    const em = container.querySelector('em')
    expect(em).not.toBeNull()
    expect(em?.textContent).toBe('italic')
  })

  it('renders external link with target="_blank" and rel="noopener noreferrer"', async () => {
    await renderAsyncServerComponent(() =>
      MarkdownView({ content: '[Example](https://example.com)' }),
    )
    const link = screen.getByRole('link', { name: 'Example' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders unordered list as plain ul/li elements styled by KRDS css', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '- item A\n- item B' }),
    )
    const ul = container.querySelector('ul')
    expect(ul).not.toBeNull()
    // ul/li are no longer custom-mapped: KRDS stylesheets own the bullets and
    // indentation, so the markup must stay free of inline style overrides.
    expect(ul?.getAttribute('style')).toBeNull()
    expect(screen.getByRole('list')).toBe(ul)
    const items = ul?.querySelectorAll('li') ?? []
    expect(items.length).toBe(2)
    expect(items[0].textContent).toBe('item A')
    expect(items[1].textContent).toBe('item B')
    expect(items[0].getAttribute('style')).toBeNull()
    expect(items[1].getAttribute('style')).toBeNull()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('renders ordered list as plain ol/li elements styled by KRDS css', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '1. first\n2. second' }),
    )
    const ol = container.querySelector('ol')
    expect(ol).not.toBeNull()
    expect(ol?.getAttribute('style')).toBeNull()
    const items = ol?.querySelectorAll('li') ?? []
    expect(items.length).toBe(2)
    expect(items[0].textContent).toBe('first')
    expect(items[1].textContent).toBe('second')
    expect(items[0].getAttribute('style')).toBeNull()
  })

  it('renders GFM tables wrapped in .krds-table-wrap with the KRDS table class', async () => {
    const table = '| a | b |\n|---|---|\n| 1 | 2 |'
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: table }),
    )
    const tableEl = container.querySelector('table')
    expect(tableEl).not.toBeNull()
    // The only remaining table override wraps the table and swaps the old
    // inline styles for the KRDS table classes.
    expect(tableEl?.parentElement).toHaveClass('krds-table-wrap')
    expect(tableEl?.className).toBe('tbl col data')
    expect(tableEl?.getAttribute('style')).toBeNull()

    const thead = container.querySelector('thead')
    expect(thead).not.toBeNull()
    expect(thead?.getAttribute('style')).toBeNull()

    const ths = tableEl?.querySelectorAll('th') ?? []
    expect(ths.length).toBe(2)
    expect(ths[0].textContent).toBe('a')
    expect(ths[1].textContent).toBe('b')
    expect(ths[0].getAttribute('style')).toBeNull()

    const bodyTr = container.querySelector('tbody tr')
    expect(bodyTr).not.toBeNull()
    expect(bodyTr?.getAttribute('style')).toBeNull()

    const tds = tableEl?.querySelectorAll('td') ?? []
    expect(tds.length).toBe(2)
    expect(tds[0].textContent).toBe('1')
    expect(tds[1].textContent).toBe('2')
    expect(tds[0].getAttribute('style')).toBeNull()
  })

  it('renders fenced code block', async () => {
    const code = '```\nconsole.log("hi")\n```'
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: code }),
    )
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre?.textContent).toContain('console.log("hi")')
  })

  it('renders inline code', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: 'use `inlineCode` here' }),
    )
    const code = container.querySelector('code')
    expect(code).not.toBeNull()
    expect(code?.textContent).toBe('inlineCode')
  })

  it('renders blockquote', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '> an important quote' }),
    )
    const bq = container.querySelector('blockquote')
    expect(bq).not.toBeNull()
    expect(bq?.textContent).toContain('an important quote')
  })

  it('renders Korean text and special characters', async () => {
    const content = '안녕하세요! 스페셜 — "따옴표" 한글 텍스트'
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content }),
    )
    expect(container.textContent).toContain('안녕하세요!')
    expect(container.textContent).toContain('스페셜')
    expect(container.textContent).toContain('"따옴표"')
    expect(container.textContent).toContain('한글 텍스트')
  })
})
