import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import * as ChannelService from '@channel.io/channel-web-sdk-loader'
import RootLayout from '@/app/(stdev)/layout'
import IntroLayout from '@/app/(stdev)/intro/layout'
import BusinessLayout from '@/app/(stdev)/business/layout'
import NoticesLayout from '@/app/(stdev)/notices/layout'
import InfoLayout from '@/app/(stdev)/info/layout'
import {
  BusinessMenu,
  IntroMenu,
  NoticesMenu,
  type Menu,
} from '@/utils/menus'

vi.mock('@next/third-parties/google', () => ({
  GoogleTagManager: () => null,
  GoogleAnalytics: () => null,
}))

vi.mock('@/app/(stdev)/providers', () => ({
  Providers: ({ children }: { children: ReactNode }) => (
    <div data-testid='providers'>{children}</div>
  ),
}))

vi.mock('@channel.io/channel-web-sdk-loader', () => ({
  loadScript: vi.fn(),
  boot: vi.fn(),
  shutdown: vi.fn(),
}))

vi.mock('@/components/layout/navbar', () => ({
  default: () => <nav data-testid='navbar' />,
}))

vi.mock('@/components/layout/footer', () => ({
  default: () => <footer data-testid='footer' />,
}))

vi.mock('@/components/layout/left-menu-layout', () => ({
  default: ({ menu, children }: { menu: Menu; children: ReactNode }) => (
    <div data-testid='left-menu-layout' data-menu={menu.label}>
      {children}
    </div>
  ),
}))

describe('RootLayout (stdev/layout.tsx)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws when NEXT_PUBLIC_GTM_ID is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', '')
    expect(() => RootLayout({ children: <div /> })).toThrow(
      'NEXT_PUBLIC_GTM_ID is not defined',
    )
  })

  it('throws when NEXT_PUBLIC_GA_ID is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_ID', '')
    expect(() => RootLayout({ children: <div /> })).toThrow(
      'NEXT_PUBLIC_GA_ID is not defined',
    )
  })

  it('does not throw with valid env vars', () => {
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-TEST')
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST')
    expect(() => RootLayout({ children: <div /> })).not.toThrow()
  })

  it('renders children inside Providers', () => {
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-TEST')
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST')
    const html = RootLayout({
      children: <div data-testid='child-content' />,
    }) as { props: { children: ReactNode[] } }
    const bodyElement = html.props.children.find(
      (child): child is { props: { children: ReactNode } } =>
        typeof child === 'object' &&
        child !== null &&
        'type' in (child as { type?: string }) &&
        (child as { type?: string }).type === 'body',
    )
    renderWithChakra(<>{bodyElement?.props.children}</>)
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByTestId('providers')).toBeInTheDocument()
  })

  it('sets <html lang="ko">', () => {
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-TEST')
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST')
    const element = RootLayout({ children: <div /> })
    expect((element as { props: { lang: string } }).props.lang).toBe('ko')
  })
})

describe('Providers (stdev/providers.tsx)', () => {
  beforeEach(() => {
    vi.mocked(ChannelService.loadScript).mockClear()
    vi.mocked(ChannelService.boot).mockClear()
    vi.mocked(ChannelService.shutdown).mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  async function importRealProviders() {
    const mod = await vi.importActual<typeof import('@/app/(stdev)/providers')>(
      '@/app/(stdev)/providers',
    )
    return mod.Providers
  }

  it('renders children inside a Chakra provider wrapper', async () => {
    const Providers = await importRealProviders()
    renderWithChakra(
      <Providers>
        <div data-testid='providers-child' />
      </Providers>,
    )
    expect(screen.getByTestId('providers-child')).toBeInTheDocument()
  })

  it('calls Channel.io loadScript and boot on mount', async () => {
    const Providers = await importRealProviders()
    renderWithChakra(
      <Providers>
        <div />
      </Providers>,
    )
    expect(ChannelService.loadScript).toHaveBeenCalled()
    expect(ChannelService.boot).toHaveBeenCalledWith({
      pluginKey: 'test-channel-key',
    })
  })

  it('calls Channel.io shutdown on unmount', async () => {
    const Providers = await importRealProviders()
    const { unmount } = renderWithChakra(
      <Providers>
        <div />
      </Providers>,
    )
    unmount()
    expect(ChannelService.shutdown).toHaveBeenCalled()
  })

  it('throws when NEXT_PUBLIC_CHANNEL_PLUGIN_KEY is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_CHANNEL_PLUGIN_KEY', '')
    vi.resetModules()
    await expect(
      vi.importActual('@/app/(stdev)/providers'),
    ).rejects.toThrow('NEXT_PUBLIC_CHANNEL_PLUGIN_KEY is not defined')
  })
})

describe('IntroLayout', () => {
  it('renders Navigation and Footer around children', () => {
    renderWithChakra(
      <IntroLayout>
        <p data-testid='intro-child'>안녕</p>
      </IntroLayout>,
    )
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('intro-child')).toHaveTextContent('안녕')
  })

  it('wraps children in LeftMenuLayout with IntroMenu', () => {
    renderWithChakra(
      <IntroLayout>
        <p data-testid='intro-child'>X</p>
      </IntroLayout>,
    )
    const wrapper = screen.getByTestId('left-menu-layout')
    expect(wrapper.getAttribute('data-menu')).toBe(IntroMenu.label)
    expect(wrapper).toContainElement(screen.getByTestId('intro-child'))
  })
})

describe('BusinessLayout', () => {
  it('renders Navigation and Footer around children', () => {
    renderWithChakra(
      <BusinessLayout>
        <p data-testid='business-child'>X</p>
      </BusinessLayout>,
    )
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('wraps children in LeftMenuLayout with BusinessMenu', () => {
    renderWithChakra(
      <BusinessLayout>
        <p data-testid='business-child'>X</p>
      </BusinessLayout>,
    )
    const wrapper = screen.getByTestId('left-menu-layout')
    expect(wrapper.getAttribute('data-menu')).toBe(BusinessMenu.label)
    expect(wrapper).toContainElement(screen.getByTestId('business-child'))
  })
})

describe('NoticesLayout', () => {
  it('renders Navigation and Footer around children', () => {
    renderWithChakra(
      <NoticesLayout>
        <p data-testid='notices-child'>X</p>
      </NoticesLayout>,
    )
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('wraps children in LeftMenuLayout with NoticesMenu', () => {
    renderWithChakra(
      <NoticesLayout>
        <p data-testid='notices-child'>X</p>
      </NoticesLayout>,
    )
    const wrapper = screen.getByTestId('left-menu-layout')
    expect(wrapper.getAttribute('data-menu')).toBe(NoticesMenu.label)
    expect(wrapper).toContainElement(screen.getByTestId('notices-child'))
  })
})

describe('InfoLayout', () => {
  it('renders children inside Navigation/Footer chrome', async () => {
    const element = await InfoLayout({
      children: <p data-testid='info-child'>hello</p>,
    })
    renderWithChakra(element)
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('info-child')).toHaveTextContent('hello')
  })

  it('does not use LeftMenuLayout wrapper', async () => {
    const element = await InfoLayout({
      children: <p data-testid='info-child'>X</p>,
    })
    renderWithChakra(element)
    expect(screen.queryByTestId('left-menu-layout')).not.toBeInTheDocument()
  })
})
