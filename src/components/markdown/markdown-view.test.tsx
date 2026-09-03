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

  it('renders h1 markdown as a heading', async () => {
    await renderAsyncServerComponent(() =>
      MarkdownView({ content: '# H1 Title' }),
    )
    expect(
      screen.getByRole('heading', { name: 'H1 Title' }),
    ).toBeInTheDocument()
  })

  it('renders h2 markdown as a heading', async () => {
    await renderAsyncServerComponent(() =>
      MarkdownView({ content: '## H2 Title' }),
    )
    expect(
      screen.getByRole('heading', { name: 'H2 Title' }),
    ).toBeInTheDocument()
  })

  it('renders h3 markdown as a heading', async () => {
    await renderAsyncServerComponent(() =>
      MarkdownView({ content: '### H3 Title' }),
    )
    expect(
      screen.getByRole('heading', { name: 'H3 Title' }),
    ).toBeInTheDocument()
  })

  it('renders h4 markdown as a heading', async () => {
    await renderAsyncServerComponent(() =>
      MarkdownView({ content: '#### H4 Title' }),
    )
    expect(
      screen.getByRole('heading', { name: 'H4 Title' }),
    ).toBeInTheDocument()
  })

  it('renders h5 markdown as a heading', async () => {
    await renderAsyncServerComponent(() =>
      MarkdownView({ content: '##### H5 Title' }),
    )
    expect(
      screen.getByRole('heading', { name: 'H5 Title' }),
    ).toBeInTheDocument()
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

  it('renders unordered list via custom ul and li components', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '- item A\n- item B' }),
    )
    const ul = container.querySelector('ul')
    expect(ul).not.toBeNull()
    // jsdom >=30 resolves rem to px in getComputedStyle, so assert the
    // inline declaration for the length instead of the computed value.
    expect(ul).toHaveStyle({ listStyleType: 'disc' })
    expect(ul?.style.marginLeft).toBe('1rem')
    const items = ul?.querySelectorAll('li') ?? []
    expect(items.length).toBe(2)
    expect(items[0].textContent).toBe('item A')
    expect(items[1].textContent).toBe('item B')
    expect(items[0]).toHaveStyle({ listStyleType: 'disc' })
    expect(items[0].style.marginLeft).toBe('1rem')
  })

  it('renders ordered list with custom li styling', async () => {
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: '1. first\n2. second' }),
    )
    const ol = container.querySelector('ol')
    expect(ol).not.toBeNull()
    const items = ol?.querySelectorAll('li') ?? []
    expect(items.length).toBe(2)
    expect(items[0].textContent).toBe('first')
    expect(items[1].textContent).toBe('second')
  })

  it('renders GFM tables with custom table, thead, th, tr, td', async () => {
    const table = '| a | b |\n|---|---|\n| 1 | 2 |'
    const { container } = await renderAsyncServerComponent(() =>
      MarkdownView({ content: table }),
    )
    const tableEl = container.querySelector('table')
    expect(tableEl).not.toBeNull()
    expect(tableEl).toHaveStyle({
      width: '100%',
      borderCollapse: 'collapse',
    })

    const thead = container.querySelector('thead')
    expect(thead).not.toBeNull()
    expect(thead).toHaveStyle({ backgroundColor: '#e5e7eb' })

    const ths = tableEl?.querySelectorAll('th') ?? []
    expect(ths.length).toBe(2)
    expect(ths[0].textContent).toBe('a')
    expect(ths[1].textContent).toBe('b')
    expect(ths[0]).toHaveStyle({ border: '1px solid #d1d5db' })

    const bodyTr = container.querySelector('tbody tr')
    expect(bodyTr).not.toBeNull()
    expect(bodyTr).toHaveStyle({ backgroundColor: '#f5f5f5' })

    const tds = tableEl?.querySelectorAll('td') ?? []
    expect(tds.length).toBe(2)
    expect(tds[0].textContent).toBe('1')
    expect(tds[1].textContent).toBe('2')
    expect(tds[0]).toHaveStyle({ border: '1px solid #d1d5db' })
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
