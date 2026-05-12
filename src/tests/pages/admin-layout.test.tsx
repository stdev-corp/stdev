import { describe, expect, it } from 'vitest'
import { isValidElement } from 'react'
import type { ReactElement } from 'react'
import { renderWithChakra, screen } from '@/tests/utils/render'
import CmsLayout from '@/app/(cms)/layout'

describe('CmsLayout', () => {
  it('renders children passed in', () => {
    renderWithChakra(
      CmsLayout({ children: <div data-testid="cms-child">hello</div> }),
    )
    expect(screen.getByTestId('cms-child')).toBeInTheDocument()
  })

  it('renders multiple children verbatim', () => {
    renderWithChakra(
      CmsLayout({
        children: (
          <>
            <span data-testid="a">A</span>
            <span data-testid="b">B</span>
          </>
        ),
      }),
    )
    expect(screen.getByTestId('a')).toBeInTheDocument()
    expect(screen.getByTestId('b')).toBeInTheDocument()
  })

  it('returns an <html> root element with lang="ko"', () => {
    const tree = CmsLayout({ children: <div /> }) as ReactElement<{
      lang?: string
    }>
    expect(isValidElement(tree)).toBe(true)
    expect(tree.type).toBe('html')
    expect(tree.props.lang).toBe('ko')
  })

  it('does not wrap children in ChakraProvider', () => {
    const tree = CmsLayout({ children: <div /> }) as ReactElement<{
      children: ReactElement
    }>
    const bodyEl = tree.props.children as ReactElement<{
      children: ReactElement
    }>
    expect(bodyEl.type).toBe('body')
    const inner = bodyEl.props.children
    expect(isValidElement(inner)).toBe(true)
    expect((inner as ReactElement).type).toBe('div')
  })
})
