import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import '@/tests/mocks/navigation'
import { resetNavigationMocks, usePathnameMock } from '@/tests/mocks/navigation'
import { renderWithChakra, screen, waitFor } from '@/tests/utils/render'
import { Links } from '@/utils/links'
import { InfoMenu } from '@/utils/menus'
import Header from './header'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: ReactNode
    [key: string]: unknown
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

function toggleWrapOf(trigger: HTMLElement) {
  return trigger.closest('li')?.querySelector('.gnb-toggle-wrap') as HTMLElement
}

/** matchMedia를 가로채고, 브레이크포인트 변경을 흉내 내는 함수를 돌려준다. */
function stubBreakpoint() {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const matchMediaMock = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) =>
      listeners.add(fn),
    removeEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) =>
      listeners.delete(fn),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  vi.stubGlobal('matchMedia', matchMediaMock)

  return {
    matchMediaMock,
    async cross(matches: boolean) {
      await act(async () => {
        listeners.forEach((fn) =>
          fn({ matches } as unknown as MediaQueryListEvent),
        )
      })
    },
  }
}

describe('<Header>', () => {
  beforeEach(() => {
    resetNavigationMocks()
    usePathnameMock.mockReturnValue(Links.root)
  })

  it('헤더와 로고 링크를 렌더링한다', () => {
    const { container } = renderWithChakra(<Header />)

    expect(container.querySelector('header#krds-header')).toBeInTheDocument()

    const logo = screen.getByRole('link', { name: '사단법인 STDev' })
    expect(logo).toHaveAttribute('href', Links.root)
    expect(logo.closest('h2')).toHaveClass('logo')
  })

  it('행사 참가하기 링크를 새 창으로 여는 외부 링크로 렌더링한다', () => {
    renderWithChakra(<Header />)

    const shop = screen.getByRole('link', { name: '행사 참가하기' })
    expect(shop).toHaveAttribute('href', Links.shop)
    expect(shop).toHaveAttribute('target', '_blank')
    expect(shop).toHaveAttribute('rel', 'noopener noreferrer')
    expect(shop).toHaveAttribute('title', '새 창 열림')
    expect(shop).toHaveClass('krds-btn', 'small', 'primary')
  })

  it('상위 메뉴마다 데스크탑 GNB 트리거 버튼을 렌더링한다', () => {
    renderWithChakra(<Header />)

    for (const label of ['법인소개', '행사&프로그램', '공지사항']) {
      const trigger = screen.getByRole('button', { name: label })
      expect(trigger).toHaveClass('gnb-main-trigger')
      expect(trigger).not.toHaveClass('active')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    }

    const intro = screen.getByRole('button', { name: '법인소개' })
    const wrap = toggleWrapOf(intro)
    expect(wrap.querySelector('a[href="/intro"]')).toHaveTextContent('바로가기')
    expect(
      Array.from(wrap.querySelectorAll('.gnb-sub-content > ul a')).map(
        (link) => link.textContent,
      ),
    ).toEqual(['연혁', '조직도', '리더십', '정관'])
  })

  it('gnb-main-trigger를 클릭하면 gnb-toggle-wrap에 is-open이 붙고 다시 클릭하면 닫힌다', async () => {
    const { user } = renderWithChakra(<Header />)

    const trigger = screen.getByRole('button', { name: '법인소개' })
    const wrap = toggleWrapOf(trigger)
    expect(wrap).not.toHaveClass('is-open')

    await user.click(trigger)
    expect(wrap).toHaveClass('gnb-toggle-wrap', 'is-open')
    expect(trigger).toHaveClass('active')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(document.body).toHaveClass('is-gnb-web')

    await user.click(trigger)
    expect(wrap).not.toHaveClass('is-open')
    expect(trigger).not.toHaveClass('active')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(document.body).not.toHaveClass('is-gnb-web')
  })

  it('다른 상위 메뉴를 클릭하면 열려 있던 메뉴가 바뀐다', async () => {
    const { user } = renderWithChakra(<Header />)

    const intro = screen.getByRole('button', { name: '법인소개' })
    const notices = screen.getByRole('button', { name: '공지사항' })

    await user.click(intro)
    expect(toggleWrapOf(intro)).toHaveClass('is-open')

    await user.click(notices)
    expect(toggleWrapOf(intro)).not.toHaveClass('is-open')
    expect(toggleWrapOf(notices)).toHaveClass('is-open')
    expect(document.body).toHaveClass('is-gnb-web')
  })

  it('배경 버튼을 클릭하면 열려 있던 데스크탑 메뉴가 닫힌다', async () => {
    const { user } = renderWithChakra(<Header />)

    const trigger = screen.getByRole('button', { name: '법인소개' })
    expect(screen.queryByRole('button', { name: '메뉴 닫기' })).toBeNull()

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: '메뉴 닫기' }))

    expect(toggleWrapOf(trigger)).not.toHaveClass('is-open')
    expect(screen.queryByRole('button', { name: '메뉴 닫기' })).toBeNull()
  })

  it('현재 경로가 속한 구역의 트리거에 is-current를 부여하고 active는 붙이지 않는다', () => {
    usePathnameMock.mockReturnValue(Links.businessHackathon)
    renderWithChakra(<Header />)

    const current = screen.getByRole('button', { name: '행사&프로그램' })
    expect(current).toHaveClass('is-current')
    // KRDS의 active는 화살표를 뒤집으므로 닫힌 패널에는 붙으면 안 된다.
    expect(current).not.toHaveClass('active')
    expect(current).toHaveAttribute('aria-expanded', 'false')

    expect(screen.getByRole('button', { name: '법인소개' })).not.toHaveClass(
      'is-current',
    )
    expect(screen.getByRole('button', { name: '공지사항' })).not.toHaveClass(
      'is-current',
    )
  })

  it('구역 최상위 경로에서도 해당 트리거가 is-current가 된다', () => {
    usePathnameMock.mockReturnValue(Links.notices)
    renderWithChakra(<Header />)

    expect(screen.getByRole('button', { name: '공지사항' })).toHaveClass(
      'is-current',
    )
    expect(
      screen.getByRole('button', { name: '행사&프로그램' }),
    ).not.toHaveClass('is-current')
  })

  it('현재 구역의 트리거를 펼치면 is-current와 active를 함께 갖는다', async () => {
    usePathnameMock.mockReturnValue(Links.notices)
    const { user } = renderWithChakra(<Header />)

    const trigger = screen.getByRole('button', { name: '공지사항' })
    await user.click(trigger)

    expect(trigger).toHaveClass('gnb-main-trigger', 'active', 'is-current')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('경로가 없으면 어떤 트리거도 강조되지 않는다', () => {
    usePathnameMock.mockReturnValue(null as unknown as string)
    renderWithChakra(<Header />)

    for (const label of ['법인소개', '행사&프로그램', '공지사항']) {
      expect(screen.getByRole('button', { name: label })).not.toHaveClass(
        'active',
      )
      expect(screen.getByRole('button', { name: label })).not.toHaveClass(
        'is-current',
      )
    }
  })

  it('현재 경로와 일치하는 하위 메뉴 링크를 데스크탑/모바일 모두에서 표시한다', () => {
    usePathnameMock.mockReturnValue(Links.introHistory)
    const { container } = renderWithChakra(<Header />)

    const desktopActive = container.querySelectorAll(
      '.gnb-toggle-wrap a.active',
    )
    expect(desktopActive).toHaveLength(1)
    expect(desktopActive[0]).toHaveTextContent('연혁')
    expect(desktopActive[0]).toHaveAttribute('href', Links.introHistory)

    const mobileSelected = container.querySelectorAll(
      '.submenu-wrap a.selected',
    )
    expect(mobileSelected).toHaveLength(1)
    expect(mobileSelected[0]).toHaveTextContent('연혁')
  })

  it('안내 및 공시 드롭 버튼이 drop-menu를 열고 닫는다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    const dropBtn = screen.getByRole('button', { name: InfoMenu.label })
    expect(dropBtn).toHaveClass('krds-btn', 'small', 'text', 'drop-btn')
    const dropMenu = container.querySelector(
      '.krds-drop-wrap .drop-menu',
    ) as HTMLElement

    expect(dropMenu).toHaveStyle({ display: 'none' })
    expect(dropBtn).toHaveAttribute('aria-expanded', 'false')

    await user.click(dropBtn)
    expect(dropMenu).toHaveStyle({ display: 'block' })
    expect(dropBtn).toHaveClass('active')
    expect(dropBtn).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('link', { name: '개인정보처리방침' }),
    ).toHaveAttribute('href', Links.infoPrivacy)
    expect(
      Array.from(dropMenu.querySelectorAll('.drop-list a')).map(
        (link) => link.textContent,
      ),
    ).toEqual(['개인정보처리방침', '이용약관', '사이트맵'])

    await user.click(dropBtn)
    expect(dropMenu).toHaveStyle({ display: 'none' })
    expect(dropBtn).not.toHaveClass('active')
  })

  it('전체메뉴 버튼이 모바일 내비게이션을 열고 닫기 버튼이 닫는다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    const openBtn = container.querySelector(
      'button.btn-navi.all',
    ) as HTMLButtonElement
    const nav = container.querySelector('nav#mobile-nav') as HTMLElement

    expect(openBtn).toHaveTextContent('전체메뉴')
    expect(openBtn).toHaveAttribute('aria-controls', 'mobile-nav')
    expect(nav).not.toHaveClass('is-open')
    expect(nav).toHaveAttribute('aria-hidden', 'true')

    await user.click(openBtn)
    expect(nav).toHaveClass('is-open', 'is-backdrop')
    expect(nav).toHaveAttribute('aria-hidden', 'false')
    expect(openBtn).toHaveAttribute('aria-expanded', 'true')
    expect(document.body).toHaveClass('is-gnb-mobile')

    const closeBtn = container.querySelector('#close-nav') as HTMLButtonElement
    expect(closeBtn).toHaveAccessibleName('전체메뉴 닫기')

    await user.click(closeBtn)
    expect(nav).not.toHaveClass('is-open')
    expect(nav).not.toHaveClass('is-backdrop')
    expect(document.body).not.toHaveClass('is-gnb-mobile')
    expect(openBtn).toHaveFocus()
  })

  it('모바일 내비게이션에 앵커 목록과 전체보기 링크를 렌더링한다', async () => {
    usePathnameMock.mockReturnValue(Links.intro)
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)

    const anchors = Array.from(
      container.querySelectorAll('.menu-wrap .gnb-main-trigger'),
    )
    expect(anchors.map((anchor) => anchor.textContent)).toEqual([
      '법인소개',
      '행사&프로그램',
      '공지사항',
      '안내 및 공시',
    ])
    anchors.forEach((anchor, index) => {
      expect(anchor).toHaveAttribute('href', `#mGnb-anchor${index + 1}`)
      expect(anchor).toHaveAttribute('aria-controls', `mGnb-anchor${index + 1}`)
    })
    expect(anchors[0]).toHaveClass('active')
    expect(anchors[1]).not.toHaveClass('active')

    const introFullView = screen.getByRole('link', {
      name: '법인소개 전체보기',
    })
    expect(introFullView).toHaveAttribute('href', Links.intro)
    expect(introFullView).toHaveClass('gnb-sub-trigger', 'selected')

    // 안내 및 공시는 href가 루트라 전체보기 링크를 만들지 않는다.
    expect(
      screen.queryByRole('link', { name: '안내 및 공시 전체보기' }),
    ).toBeNull()
    expect(
      container.querySelectorAll('#mGnb-anchor4 .gnb-sub-trigger'),
    ).toHaveLength(InfoMenu.subMenus.length)

    expect(screen.getAllByRole('link', { name: '행사 참가하기' })).toHaveLength(
      2,
    )
  })

  it('Escape 키를 누르면 열려 있던 데스크탑 메뉴가 닫힌다', async () => {
    const { user } = renderWithChakra(<Header />)

    const trigger = screen.getByRole('button', { name: '법인소개' })
    await user.click(trigger)
    expect(toggleWrapOf(trigger)).toHaveClass('is-open')

    // Escape가 아닌 키는 메뉴를 닫지 않는다.
    await user.keyboard('{ArrowDown}')
    expect(toggleWrapOf(trigger)).toHaveClass('is-open')

    await user.keyboard('{Escape}')
    expect(toggleWrapOf(trigger)).not.toHaveClass('is-open')
    expect(document.body).not.toHaveClass('is-gnb-web')
  })

  it('Escape 키를 누르면 모바일 내비게이션과 드롭 메뉴도 닫힌다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    const dropBtn = screen.getByRole('button', { name: InfoMenu.label })
    const dropMenu = container.querySelector(
      '.krds-drop-wrap .drop-menu',
    ) as HTMLElement
    const nav = container.querySelector('nav#mobile-nav') as HTMLElement

    await user.click(dropBtn)
    await user.click(container.querySelector('button.btn-navi.all')!)
    expect(dropMenu).toHaveStyle({ display: 'block' })
    expect(nav).toHaveClass('is-open')

    await user.keyboard('{Escape}')
    expect(dropMenu).toHaveStyle({ display: 'none' })
    expect(nav).not.toHaveClass('is-open')
    expect(document.body).not.toHaveClass('is-gnb-mobile')
  })

  it('경로가 바뀌면 열려 있던 메뉴를 모두 닫는다', async () => {
    const { container, rerender, user } = renderWithChakra(<Header />)

    const trigger = screen.getByRole('button', { name: '법인소개' })
    await user.click(trigger)
    await user.click(container.querySelector('button.btn-navi.all')!)
    expect(toggleWrapOf(trigger)).toHaveClass('is-open')

    usePathnameMock.mockReturnValue(Links.noticesPress)
    rerender(<Header />)

    expect(toggleWrapOf(trigger)).not.toHaveClass('is-open')
    expect(container.querySelector('nav#mobile-nav')).not.toHaveClass('is-open')
    expect(document.body).not.toHaveClass('is-gnb-web')
    expect(document.body).not.toHaveClass('is-gnb-mobile')
    expect(screen.getByRole('button', { name: '공지사항' })).toHaveClass(
      'is-current',
    )
  })

  it('안내 및 공시 경로에서도 해당 구역을 활성으로 표시한다', () => {
    usePathnameMock.mockReturnValue(Links.infoSitemap)
    const { container } = renderWithChakra(<Header />)

    const mobileTriggers = Array.from(
      container.querySelectorAll('.menu-wrap .gnb-main-trigger'),
    )
    const info = mobileTriggers.find(
      (trigger) => trigger.textContent === InfoMenu.label,
    )!
    expect(info).toHaveClass('active')
    expect(
      mobileTriggers.filter((trigger) => trigger.classList.contains('active')),
    ).toHaveLength(1)
  })

  it('홈에서는 안내 및 공시가 활성 구역이 되지 않는다', () => {
    usePathnameMock.mockReturnValue(Links.root)
    const { container } = renderWithChakra(<Header />)

    const active = container.querySelectorAll(
      '.menu-wrap .gnb-main-trigger.active',
    )
    expect(active).toHaveLength(0)
  })

  it('현재 페이지의 링크를 다시 눌러도 모바일 서랍이 닫힌다', async () => {
    usePathnameMock.mockReturnValue(Links.infoSitemap)
    const { container, user } = renderWithChakra(<Header />)

    const nav = container.querySelector('nav#mobile-nav') as HTMLElement
    await user.click(container.querySelector('button.btn-navi.all')!)
    expect(nav).toHaveClass('is-open')
    expect(document.body).toHaveClass('is-gnb-mobile')

    // 경로가 그대로여도(선택된 링크 재클릭) 서랍과 스크롤 잠금이 풀려야 한다.
    const current = nav.querySelector(
      `a.gnb-sub-trigger.selected[href="${Links.infoSitemap}"]`,
    ) as HTMLElement
    expect(current).not.toBeNull()
    await user.click(current)

    expect(nav).not.toHaveClass('is-open')
    expect(document.body).not.toHaveClass('is-gnb-mobile')
  })

  it('데스크탑 GNB의 하위 링크를 누르면 메뉴가 닫힌다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    const trigger = screen.getByRole('button', { name: '법인소개' })
    await user.click(trigger)
    const wrap = toggleWrapOf(trigger)
    expect(wrap).toHaveClass('is-open')

    await user.click(wrap.querySelector(`a[href="${Links.introHistory}"]`)!)

    expect(wrap).not.toHaveClass('is-open')
    expect(document.body).not.toHaveClass('is-gnb-web')
    expect(container.querySelector('.gnb-backdrop')).toBeNull()
  })

  it('모바일 서랍을 열면 포커스를 서랍으로 옮기고 나머지 화면을 inert 처리한다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    const opener = container.querySelector(
      'button.btn-navi.all',
    ) as HTMLButtonElement
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    const headerIn = container.querySelector('.header-in') as HTMLElement

    await user.click(opener)

    expect(headerIn).toHaveAttribute('inert')
    // 포커스 이동은 전환이 끝난 뒤(프레임 이후)에 일어난다.
    await waitFor(() => expect(document.activeElement).toBe(drawer))

    await user.click(screen.getByRole('button', { name: '전체메뉴 닫기' }))

    expect(headerIn).not.toHaveAttribute('inert')
    expect(document.activeElement).toBe(opener)
  })

  it('Escape로 서랍을 닫아도 포커스가 열었던 버튼으로 돌아온다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    const opener = container.querySelector(
      'button.btn-navi.all',
    ) as HTMLButtonElement
    await user.click(opener)
    await waitFor(() => expect(document.activeElement).not.toBe(opener))

    await user.keyboard('{Escape}')

    expect(container.querySelector('nav#mobile-nav')).not.toHaveClass('is-open')
    expect(document.activeElement).toBe(opener)
  })

  it('서랍 안에서 Tab 포커스가 순환한다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    await waitFor(() => expect(document.activeElement).toBe(drawer))
    const focusable = Array.from(
      drawer.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'),
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    // 서랍 컨테이너에서 Shift+Tab 하면 마지막 요소로 감싼다.
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(last)

    await user.keyboard('{Tab}')
    expect(document.activeElement).toBe(first)
  })

  it('데스크탑 폭으로 넓어지면 열려 있던 서랍과 inert를 정리한다', async () => {
    const { matchMediaMock, cross } = stubBreakpoint()

    const { container, user } = renderWithChakra(<Header />)
    const headerIn = container.querySelector('.header-in') as HTMLElement

    await user.click(container.querySelector('button.btn-navi.all')!)
    expect(container.querySelector('nav#mobile-nav')).toHaveClass('is-open')
    expect(headerIn).toHaveAttribute('inert')

    expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 1024px)')
    // 1024px를 넘어서면 CSS가 서랍을 감추므로 상태도 함께 닫혀야 한다.
    await cross(true)

    expect(container.querySelector('nav#mobile-nav')).not.toHaveClass('is-open')
    expect(headerIn).not.toHaveAttribute('inert')
    expect(document.body).not.toHaveClass('is-gnb-mobile')
    vi.unstubAllGlobals()
  })

  it('데스크탑으로 넓어질 때 서랍 안의 포커스를 GNB 트리거로 옮긴다', async () => {
    usePathnameMock.mockReturnValue(Links.notices)
    const { cross } = stubBreakpoint()
    const { container, user } = renderWithChakra(<Header />)

    const opener = container.querySelector(
      'button.btn-navi.all',
    ) as HTMLButtonElement
    await user.click(opener)
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    await waitFor(() => expect(document.activeElement).toBe(drawer))

    await cross(true)

    // 전체메뉴 버튼은 데스크탑에서 감춰지므로 현재 구역 트리거로 간다.
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: '공지사항' }),
    )
    expect(document.activeElement).not.toBe(document.body)
    vi.unstubAllGlobals()
  })

  it('안내 및 공시 경로에서는 데스크탑으로 넓어질 때 유틸리티 버튼으로 옮긴다', async () => {
    // InfoMenu는 데스크탑 GNB에 없고 헤더 유틸리티 드롭다운이 대신한다.
    usePathnameMock.mockReturnValue(Links.infoSitemap)
    const { cross } = stubBreakpoint()
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    await waitFor(() => expect(document.activeElement).toBe(drawer))

    await cross(true)

    const dropButton = screen.getByRole('button', { name: InfoMenu.label })
    expect(document.activeElement).toBe(dropButton)
    // 무관한 첫 GNB 트리거로 가면 안 된다.
    expect(document.activeElement).not.toBe(
      screen.getByRole('button', { name: '법인소개' }),
    )
    vi.unstubAllGlobals()
  })

  it('서랍에서 다른 구역을 둘러보던 중이면 그 구역의 트리거로 옮긴다', async () => {
    // 경로는 /intro 지만 서랍에서 공지사항을 펼쳐 보고 있던 상황.
    usePathnameMock.mockReturnValue(Links.intro)
    const { cross } = stubBreakpoint()
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    await waitFor(() => expect(document.activeElement).toBe(drawer))

    const anchors = Array.from(
      container.querySelectorAll<HTMLElement>('.menu-wrap .gnb-main-trigger'),
    )
    await user.click(anchors.find((a) => a.textContent === '공지사항')!)

    await cross(true)

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: '공지사항' }),
    )
    // URL이 가리키는 구역으로 가면 안 된다.
    expect(document.activeElement).not.toBe(
      screen.getByRole('button', { name: '법인소개' }),
    )
    vi.unstubAllGlobals()
  })

  it('서랍에서 안내 및 공시를 둘러보던 중이면 유틸리티 버튼으로 옮긴다', async () => {
    usePathnameMock.mockReturnValue(Links.intro)
    const { cross } = stubBreakpoint()
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    await waitFor(() => expect(document.activeElement).toBe(drawer))

    const anchors = Array.from(
      container.querySelectorAll<HTMLElement>('.menu-wrap .gnb-main-trigger'),
    )
    await user.click(anchors.find((a) => a.textContent === InfoMenu.label)!)

    await cross(true)

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: InfoMenu.label }),
    )
    vi.unstubAllGlobals()
  })

  it('현재 구역이 없으면 데스크탑으로 넓어질 때 주 메뉴 첫 트리거로 옮긴다', async () => {
    usePathnameMock.mockReturnValue(Links.root)
    const { cross } = stubBreakpoint()
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    await waitFor(() => expect(document.activeElement).toBe(drawer))

    await cross(true)

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: '법인소개' }),
    )
    vi.unstubAllGlobals()
  })

  it('모바일로 좁아질 때 데스크탑 메뉴의 포커스를 전체메뉴 버튼으로 옮긴다', async () => {
    const { cross } = stubBreakpoint()
    const { container, user } = renderWithChakra(<Header />)

    const trigger = screen.getByRole('button', { name: '법인소개' })
    await user.click(trigger)
    const link = screen.getByRole('link', { name: '연혁' })
    link.focus()
    expect(document.activeElement).toBe(link)

    await cross(false)

    expect(document.activeElement).toBe(
      container.querySelector('button.btn-navi.all'),
    )
    vi.unstubAllGlobals()
  })

  it('감춰지지 않는 곳에 포커스가 있으면 브레이크포인트 변경이 포커스를 옮기지 않는다', async () => {
    const { cross } = stubBreakpoint()
    renderWithChakra(<Header />)

    const shop = screen.getByRole('link', { name: '행사 참가하기' })
    shop.focus()
    expect(document.activeElement).toBe(shop)

    await cross(true)
    expect(document.activeElement).toBe(shop)

    await cross(false)
    expect(document.activeElement).toBe(shop)
    vi.unstubAllGlobals()
  })

  it('서랍을 열면 스킵 링크를 포함한 형제 영역을 모두 inert 처리한다', async () => {
    // 스킵 링크와 본문/푸터는 SiteLayout이 그리므로 같은 골격을 만들어 확인한다.
    const { container, user } = renderWithChakra(
      <div id="wrap" className="g-wrap">
        <div id="krds-skip-link">
          <a href="#krds-content">본문 바로가기</a>
        </div>
        <Header />
        <div id="container" />
        <footer id="krds-footer" />
      </div>,
    )

    await user.click(container.querySelector('button.btn-navi.all')!)

    for (const selector of [
      '#krds-skip-link',
      '#container',
      '#krds-footer',
      '#krds-header .header-in',
    ]) {
      expect(container.querySelector(selector)).toHaveAttribute('inert')
    }
    // 서랍이 들어 있는 header 자체는 격리하면 안 된다.
    expect(container.querySelector('#krds-header')).not.toHaveAttribute('inert')

    await user.click(screen.getByRole('button', { name: '전체메뉴 닫기' }))

    for (const selector of ['#krds-skip-link', '#container', '#krds-footer']) {
      expect(container.querySelector(selector)).not.toHaveAttribute('inert')
    }
  })

  it('데스크탑 GNB를 Escape로 닫으면 포커스가 트리거로 돌아온다', async () => {
    const { user } = renderWithChakra(<Header />)

    const trigger = screen.getByRole('button', { name: '법인소개' })
    await user.click(trigger)
    const panelLink = screen.getByRole('link', { name: '연혁' })
    panelLink.focus()
    expect(document.activeElement).toBe(panelLink)

    await user.keyboard('{Escape}')

    expect(document.activeElement).toBe(trigger)
  })

  it('유틸리티 드롭다운을 Escape로 닫으면 포커스가 드롭 버튼으로 돌아온다', async () => {
    const { user } = renderWithChakra(<Header />)

    const dropBtn = screen.getByRole('button', { name: InfoMenu.label })
    await user.click(dropBtn)
    const item = screen.getByRole('link', { name: '사이트맵' })
    item.focus()

    await user.keyboard('{Escape}')

    expect(document.activeElement).toBe(dropBtn)
  })

  it('모바일 좌측 목록의 active를 클릭한 패널에 맞춘다', async () => {
    usePathnameMock.mockReturnValue(Links.intro)
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    const anchors = Array.from(
      container.querySelectorAll<HTMLElement>('.menu-wrap .gnb-main-trigger'),
    )
    const intro = anchors.find((a) => a.textContent === '법인소개')!
    const notices = anchors.find((a) => a.textContent === '공지사항')!

    expect(intro).toHaveClass('active')
    expect(notices).not.toHaveClass('active')

    await user.click(notices)

    expect(notices).toHaveClass('active')
    expect(intro).not.toHaveClass('active')
  })

  it('현재 경로의 링크에 aria-current를 부여한다', () => {
    usePathnameMock.mockReturnValue(Links.introHistory)
    const { container } = renderWithChakra(<Header />)

    const current = Array.from(
      container.querySelectorAll(`a[href="${Links.introHistory}"]`),
    )
    expect(current.length).toBeGreaterThan(0)
    current.forEach((link) =>
      expect(link).toHaveAttribute('aria-current', 'page'),
    )

    container
      .querySelectorAll(`a[href="${Links.introChart}"]`)
      .forEach((link) => expect(link).not.toHaveAttribute('aria-current'))
  })

  it('언마운트되면 body의 상태 클래스를 정리한다', async () => {
    const { container, unmount, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    expect(document.body).toHaveClass('is-gnb-mobile')

    unmount()
    expect(document.body).not.toHaveClass('is-gnb-mobile')
    expect(document.body).not.toHaveClass('is-gnb-web')
  })
})
