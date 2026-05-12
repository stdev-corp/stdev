import { describe, expect, it } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import BasicLayout from '@/components/layout/basic-layout'

describe('<BasicLayout>', () => {
  it('renders its child content', () => {
    renderWithChakra(
      <BasicLayout>
        <p>hello world</p>
      </BasicLayout>,
    )
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('renders multiple children', () => {
    renderWithChakra(
      <BasicLayout>
        <p>first</p>
        <p>second</p>
        <p>third</p>
      </BasicLayout>,
    )
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
    expect(screen.getByText('third')).toBeInTheDocument()
  })

  it('wraps children in a single container element', () => {
    const { container } = renderWithChakra(
      <BasicLayout>
        <span data-testid="inner">x</span>
      </BasicLayout>,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root).not.toBeNull()
    expect(root.tagName).toBe('DIV')
    expect(root.contains(screen.getByTestId('inner'))).toBe(true)
  })

  it('applies Chakra styling classes to the wrapper', () => {
    const { container } = renderWithChakra(
      <BasicLayout>
        <span>y</span>
      </BasicLayout>,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.className.length).toBeGreaterThan(0)
  })
})
