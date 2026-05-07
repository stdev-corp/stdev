import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import WebpageList from '@/components/webpage-list'
import type { WebpageWithBusiness } from '@/utils/cms-types'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname: string }
    children: ReactNode
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

describe('<WebpageList>', () => {
  it('renders empty-state message when no webpages provided', () => {
    const { container } = renderWithChakra(<WebpageList webpages={[]} />)
    expect(screen.getByText('자료가 존재하지 않습니다.')).toBeInTheDocument()
    expect(container.querySelectorAll('a').length).toBe(0)
  })

  it('renders a single webpage with title, author, date, and business_name', () => {
    const webpages: WebpageWithBusiness[] = [
      {
        id: 1,
        title: 'Post A',
        author: 'Alice',
        url: 'https://blog.example/a',
        publishedDate: new Date('2026-05-07T00:00:00Z'),
        business_name: 'Acme',
      },
    ]
    renderWithChakra(<WebpageList webpages={webpages} />)
    expect(screen.getByText('Post A')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('2026년 5월 7일')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
  })

  it('renders multiple webpages in order', () => {
    const webpages: WebpageWithBusiness[] = [
      {
        id: 1,
        title: 'Post A',
        author: 'Alice',
        url: 'https://blog.example/a',
        publishedDate: new Date('2026-05-07T00:00:00Z'),
        business_name: 'Acme',
      },
      {
        id: 2,
        title: 'Post B',
        author: 'Bob',
        url: 'https://blog.example/b',
        publishedDate: new Date('2026-03-01T00:00:00Z'),
        business_name: '',
      },
    ]
    const { container } = renderWithChakra(<WebpageList webpages={webpages} />)
    const links = container.querySelectorAll('a')
    expect(links.length).toBe(2)
    expect(links[0]).toHaveAttribute('href', 'https://blog.example/a')
    expect(links[1]).toHaveAttribute('href', 'https://blog.example/b')
    expect(screen.getByText('Post A')).toBeInTheDocument()
    expect(screen.getByText('Post B')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('each webpage link points to webpage.url with target="_blank" and rel="noopener noreferrer"', () => {
    const webpages: WebpageWithBusiness[] = [
      {
        id: 1,
        title: 'Post X',
        author: 'Author X',
        url: 'https://example.com/x',
        publishedDate: new Date('2026-01-01T00:00:00Z'),
        business_name: 'X Corp',
      },
    ]
    const { container } = renderWithChakra(<WebpageList webpages={webpages} />)
    const link = container.querySelector('a')
    expect(link).not.toBeNull()
    expect(link).toHaveAttribute('href', 'https://example.com/x')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('formats publishedDate in Korean style', () => {
    const webpages: WebpageWithBusiness[] = [
      {
        id: 1,
        title: 'Post T',
        author: 'A',
        url: 'https://x.com',
        publishedDate: new Date('2026-03-01T00:00:00Z'),
        business_name: 'B',
      },
    ]
    renderWithChakra(<WebpageList webpages={webpages} />)
    expect(screen.getByText('2026년 3월 1일')).toBeInTheDocument()
  })

  it('renders a webpage with empty business_name without crashing', () => {
    const webpages: WebpageWithBusiness[] = [
      {
        id: 2,
        title: 'Post B',
        author: 'Bob',
        url: 'https://blog.example/b',
        publishedDate: new Date('2026-03-01T00:00:00Z'),
        business_name: '',
      },
    ]
    renderWithChakra(<WebpageList webpages={webpages} />)
    expect(screen.getByText('Post B')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('2026년 3월 1일')).toBeInTheDocument()
  })
})
