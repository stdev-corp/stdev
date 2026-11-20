import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import '@/tests/mocks/navigation'
import { resetNavigationMocks, usePathnameMock } from '@/tests/mocks/navigation'
import { renderWithChakra, screen, waitFor } from '@/tests/utils/render'
import { Links } from '@/utils/links'
import {
  ConferenceMenu,
  HackathonMenu,
  InfoMenu,
  IntroMenu,
  NoticesMenu,
} from '@/utils/menus'
import Header from './header'
import { LOGO_SRC } from './wordmark'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const {
      fill: _fill,
      priority: _priority,
      loader: _loader,
      quality: _quality,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      unoptimized: _unoptimized,
      ...imgProps
    } = props
    return <img {...imgProps} />
  },
}))

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

/** 트리거가 aria-controls로 가리키는 데스크탑 GNB 패널. 네 트리거가 같은 패널을 공유한다. */
function toggleWrapOf(trigger: HTMLElement) {
  return document.getElementById(
    trigger.getAttribute('aria-controls')!,
  ) as HTMLElement
}

/**
 * 데스크탑 패널과 모바일 서랍에서 aria-current가 붙은 하위 메뉴 링크를 모은다.
 * 표시 클래스(데스크탑 active, 모바일 selected)가 정확히 같은 링크에만 붙는지도 함께 확인한다.
 */
function currentSubMenuLinks(container: HTMLElement) {
  const desktop = Array.from(
    container.querySelectorAll<HTMLElement>('.gnb-toggle-wrap ul a'),
  )
  const mobile = Array.from(
    container.querySelectorAll<HTMLElement>('.submenu-wrap ul a'),
  )
  const desktopCurrent = desktop.filter((link) =>
    link.hasAttribute('aria-current'),
  )
  const mobileCurrent = mobile.filter((link) =>
    link.hasAttribute('aria-current'),
  )

  expect(desktop.filter((link) => link.classList.contains('active'))).toEqual(
    desktopCurrent,
  )
  expect(mobile.filter((link) => link.classList.contains('selected'))).toEqual(
    mobileCurrent,
  )
  // 현재 위치가 아니어도 모바일 링크는 KRDS 기본 클래스를 잃지 않는다.
  mobile.forEach((link) => expect(link).toHaveClass('gnb-sub-trigger'))

  return { desktop: desktopCurrent, mobile: mobileCurrent }
}

/** 링크가 들어 있는 패널/서랍 구역의 제목. */
function sectionTitleOf(link: HTMLElement) {
  return link.closest('.gnb-sub-list')!.querySelector('.sub-title')!.textContent
}

const DESKTOP_SECTIONS = [
  '법인소개',
  '해커톤&아이디어톤',
  '컨퍼런스&프로그램',
  '공지사항',
]

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

  it('로고 링크 안에 원형 심벌을 워드마크 왼쪽에 장식 이미지로 둔다', () => {
    renderWithChakra(<Header />)

    const logo = screen.getByRole('link', { name: '사단법인 STDev' })
    const symbol = logo.querySelector('img')!
    expect(symbol).toHaveClass('stdev-symbol')
    expect(symbol).toHaveAttribute('src', LOGO_SRC)
    // 뒤따르는 텍스트가 이름을 대신하므로 대체 텍스트는 비운다.
    expect(symbol).toHaveAttribute('alt', '')
    expect(logo.firstElementChild).toBe(symbol)
    expect(logo.textContent?.trim()).toBe('사단법인 STDev')
  })

  it('행사 참가하기 링크를 같은 창에서 여는 해커톤 내부 링크로 렌더링한다', () => {
    const { container } = renderWithChakra(<Header />)

    const event = screen.getByRole('link', { name: '행사 참가하기' })
    expect(event).toHaveAttribute('href', Links.hackathon)
    expect(event).toHaveAttribute('href', '/hackathon')
    expect(event).not.toHaveAttribute('target')
    expect(event).not.toHaveAttribute('rel')
    expect(event).not.toHaveAttribute('title')
    expect(event).toHaveClass('krds-btn', 'small', 'primary')
    expect(event.closest('.header-actions')).not.toBeNull()

    // 서랍 안의 같은 링크도 내부 링크다.
    const drawerLink = container.querySelector(
      'nav#mobile-nav .gnb-utils a',
    ) as HTMLElement
    expect(drawerLink).toHaveTextContent('행사 참가하기')
    expect(drawerLink).toHaveAttribute('href', Links.hackathon)
    expect(drawerLink).not.toHaveAttribute('target')
    expect(drawerLink).toHaveClass('krds-btn', 'xsmall', 'text')
    expect(
      container.querySelector('a[href^="https://event.stdev.kr"]'),
    ).toBeNull()
  })

  it('서랍의 행사 참가하기 링크를 누르면 서랍이 닫힌다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    const nav = container.querySelector('nav#mobile-nav') as HTMLElement
    await user.click(container.querySelector('button.btn-navi.all')!)
    expect(nav).toHaveClass('is-open')

    // jsdom은 문서 이동을 지원하지 않으므로 클릭 뒤 기본 동작만 막는다.
    const preventNavigation = (event: Event) => event.preventDefault()
    document.addEventListener('click', preventNavigation)
    await user.click(nav.querySelector('.gnb-utils a') as HTMLElement)
    document.removeEventListener('click', preventNavigation)

    expect(nav).not.toHaveClass('is-open')
    expect(document.body).not.toHaveClass('is-gnb-mobile')
  })

  it('헤더 상단에 안내 및 공시 유틸리티 드롭다운을 두지 않는다', () => {
    const { container } = renderWithChakra(<Header />)

    expect(container.querySelector('.header-utility')).toBeNull()
    expect(container.querySelector('.krds-drop-wrap')).toBeNull()
    expect(screen.queryByRole('button', { name: InfoMenu.label })).toBeNull()
    // 안내 및 공시 하위 페이지는 (닫혀 있어 aria-hidden인) 모바일 서랍에서만 노출된다.
    for (const subMenu of InfoMenu.subMenus) {
      const links = container.querySelectorAll(`a[href="${subMenu.href}"]`)
      expect(links).toHaveLength(1)
      expect(links[0].closest('nav#mobile-nav')).not.toBeNull()
    }
  })

  it('상위 메뉴마다 데스크탑 GNB 트리거 버튼을 렌더링한다', () => {
    renderWithChakra(<Header />)

    const navigation = screen.getByRole('navigation', { name: '주 메뉴' })
    expect(
      Array.from(navigation.querySelectorAll('.gnb-main-trigger')).map(
        (trigger) => trigger.textContent,
      ),
    ).toEqual(DESKTOP_SECTIONS)

    for (const label of DESKTOP_SECTIONS) {
      const trigger = screen.getByRole('button', { name: label })
      expect(trigger).toHaveClass('gnb-main-trigger')
      expect(trigger).not.toHaveClass('active')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    }

    const intro = screen.getByRole('button', { name: '법인소개' })
    const wrap = toggleWrapOf(intro)
    expect(wrap).toHaveClass('gnb-toggle-wrap')
    // 구역 자체의 페이지가 없으므로 제목에 바로가기 링크를 달지 않는다.
    expect(wrap.querySelector('.sub-title a')).toBeNull()
    expect(screen.queryByRole('link', { name: /바로가기/ })).toBeNull()
    expect(
      Array.from(
        wrap.querySelectorAll(
          '.gnb-sub-list:first-child .gnb-sub-content > ul a',
        ),
      ).map((link) => link.textContent),
    ).toEqual(['사단법인 에스티데브', '연혁', '조직도', '리더십', '정관'])
  })

  it('데스크탑 GNB 패널은 하나뿐이며 네 트리거가 모두 그 패널을 가리킨다', () => {
    const { container } = renderWithChakra(<Header />)

    const panels = container.querySelectorAll(
      '.krds-main-menu .gnb-toggle-wrap',
    )
    expect(panels).toHaveLength(1)
    for (const label of DESKTOP_SECTIONS) {
      expect(toggleWrapOf(screen.getByRole('button', { name: label }))).toBe(
        panels[0],
      )
    }
  })

  it('어느 트리거를 열어도 패널에 네 구역이 모두 나온다', async () => {
    const { user } = renderWithChakra(<Header />)

    for (const label of DESKTOP_SECTIONS) {
      const trigger = screen.getByRole('button', { name: label })
      await user.click(trigger)
      const wrap = toggleWrapOf(trigger)
      expect(wrap).toHaveClass('is-open')

      const sections = Array.from(wrap.querySelectorAll('.gnb-sub-list'))
      expect(
        sections.map(
          (section) =>
            section.querySelector('.sub-title')?.firstChild?.textContent,
        ),
      ).toEqual(DESKTOP_SECTIONS)
      expect(wrap.querySelectorAll('.sub-title a')).toHaveLength(0)
      expect(
        sections.map((section) =>
          Array.from(section.querySelectorAll('ul a')).map(
            (link) => link.textContent,
          ),
        ),
      ).toEqual([
        ['사단법인 에스티데브', '연혁', '조직도', '리더십', '정관'],
        ['행사 소개', '뉴스 기사', '참여후기'],
        ['행사 소개', '뉴스 기사', '참여후기'],
        ['보도자료', '연간 기부금 모금액 및 활용실적', '총회 및 이사회'],
      ])
      expect(
        sections
          .slice(1, 3)
          .map((section) =>
            Array.from(section.querySelectorAll('ul a')).map((link) =>
              link.getAttribute('href'),
            ),
          ),
      ).toEqual([
        HackathonMenu.subMenus.map((subMenu) => subMenu.href),
        ConferenceMenu.subMenus.map((subMenu) => subMenu.href),
      ])
      expect(sections[1].querySelectorAll('ul a')[0].getAttribute('href')).toBe(
        '/hackathon',
      )
      expect(sections[2].querySelectorAll('ul a')[0].getAttribute('href')).toBe(
        '/conference',
      )

      // 다음 반복을 위해 닫는다.
      await user.click(trigger)
      expect(wrap).not.toHaveClass('is-open')
    }
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

  it('다른 상위 메뉴를 클릭하면 패널은 열린 채 펼침 표시만 옮겨 간다', async () => {
    const { user } = renderWithChakra(<Header />)

    const intro = screen.getByRole('button', { name: '법인소개' })
    const notices = screen.getByRole('button', { name: '공지사항' })
    const wrap = toggleWrapOf(intro)

    await user.click(intro)
    expect(wrap).toHaveClass('is-open')
    expect(intro).toHaveClass('active')
    expect(intro).toHaveAttribute('aria-expanded', 'true')

    await user.click(notices)
    expect(wrap).toHaveClass('is-open')
    expect(intro).not.toHaveClass('active')
    expect(intro).toHaveAttribute('aria-expanded', 'false')
    expect(notices).toHaveClass('active')
    expect(notices).toHaveAttribute('aria-expanded', 'true')
    expect(document.body).toHaveClass('is-gnb-web')
    expect(document.activeElement).toBe(notices)

    // 펼쳐 둔 트리거를 다시 누르면 닫힌다.
    await user.click(notices)
    expect(wrap).not.toHaveClass('is-open')
    expect(notices).not.toHaveClass('active')
    expect(document.body).not.toHaveClass('is-gnb-web')
  })

  it('패널 안에 포커스를 둔 채 다른 트리거를 누르면 포커스가 그 트리거에 남는다', async () => {
    const { user } = renderWithChakra(<Header />)

    const intro = screen.getByRole('button', { name: '법인소개' })
    const notices = screen.getByRole('button', { name: '공지사항' })

    await user.click(intro)
    screen.getByRole('link', { name: '연혁' }).focus()

    await user.click(notices)

    // 이전 트리거(법인소개)로 되돌리면 안 된다.
    expect(document.activeElement).toBe(notices)
    expect(toggleWrapOf(notices)).toHaveClass('is-open')
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
    usePathnameMock.mockReturnValue(Links.hackathonNews)
    renderWithChakra(<Header />)

    const current = screen.getByRole('button', { name: '해커톤&아이디어톤' })
    expect(current).toHaveClass('is-current')
    // KRDS의 active는 화살표를 뒤집으므로 닫힌 패널에는 붙으면 안 된다.
    expect(current).not.toHaveClass('active')
    expect(current).toHaveAttribute('aria-expanded', 'false')

    for (const label of ['법인소개', '컨퍼런스&프로그램', '공지사항']) {
      expect(screen.getByRole('button', { name: label })).not.toHaveClass(
        'is-current',
      )
    }
  })

  it('행사 페이지와 그 하위 페이지에서는 그 행사 구역의 트리거가 is-current가 된다', () => {
    const { rerender } = renderWithChakra(<Header />)

    for (const [pathname, label] of [
      ['/hackathon/dsf26', '해커톤&아이디어톤'],
      ['/hackathon/dsf26/notice/team-building', '해커톤&아이디어톤'],
      ['/conference/ai-summit', '컨퍼런스&프로그램'],
      [Links.conference, '컨퍼런스&프로그램'],
    ]) {
      usePathnameMock.mockReturnValue(pathname)
      rerender(<Header />)

      const current = document.querySelectorAll(
        '.krds-main-menu .gnb-main-trigger.is-current',
      )
      expect(current).toHaveLength(1)
      expect(current[0]).toHaveTextContent(label)
    }
  })

  it('구역 경로 접두사만 맞는 경로에서도 해당 트리거가 is-current가 된다', () => {
    usePathnameMock.mockReturnValue(`${NoticesMenu.path}/unknown`)
    renderWithChakra(<Header />)

    expect(screen.getByRole('button', { name: '공지사항' })).toHaveClass(
      'is-current',
    )
    expect(
      screen.getByRole('button', { name: '해커톤&아이디어톤' }),
    ).not.toHaveClass('is-current')
  })

  it('구역 경로로 시작하기만 하는 다른 경로나 옛 /business 경로는 어느 구역도 강조하지 않는다', () => {
    const { container, rerender } = renderWithChakra(<Header />)

    for (const pathname of [
      '/hackathons',
      '/conference-old',
      '/business/hackathon',
    ]) {
      usePathnameMock.mockReturnValue(pathname)
      rerender(<Header />)

      expect(container.querySelector('.gnb-main-trigger.is-current')).toBeNull()
      expect(
        container.querySelector('.menu-wrap .gnb-main-trigger.active'),
      ).toBeNull()
    }
  })

  it('현재 구역의 트리거를 펼치면 is-current와 active를 함께 갖는다', async () => {
    usePathnameMock.mockReturnValue(Links.noticesPress)
    const { user } = renderWithChakra(<Header />)

    const trigger = screen.getByRole('button', { name: '공지사항' })
    await user.click(trigger)

    expect(trigger).toHaveClass('gnb-main-trigger', 'active', 'is-current')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('다른 1Depth를 펼친 동안은 현재 구역 밑줄을 감춰 두 곳이 강조되지 않게 한다', async () => {
    usePathnameMock.mockReturnValue(Links.introHistory)
    const { user } = renderWithChakra(<Header />)

    const intro = screen.getByRole('button', { name: '법인소개' })
    const hackathon = screen.getByRole('button', { name: '해커톤&아이디어톤' })
    expect(intro).toHaveClass('is-current')

    await user.click(intro)
    expect(intro).toHaveClass('active', 'is-current')

    // 현재 구역이 아닌 트리거로 옮기면 밑줄은 그 트리거 하나만 갖는다.
    await user.click(hackathon)
    expect(hackathon).toHaveClass('active')
    expect(hackathon).not.toHaveClass('is-current')
    expect(intro).not.toHaveClass('active')
    expect(intro).not.toHaveClass('is-current')

    // 닫으면 현재 구역 밑줄이 돌아온다.
    await user.click(hackathon)
    expect(hackathon).not.toHaveClass('active')
    expect(intro).toHaveClass('is-current')
  })

  it('경로가 없으면 어떤 트리거도 강조되지 않는다', () => {
    usePathnameMock.mockReturnValue(null as unknown as string)
    renderWithChakra(<Header />)

    for (const label of DESKTOP_SECTIONS) {
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

  it('모바일 내비게이션에 앵커 목록과 구역별 하위 링크를 렌더링한다', async () => {
    usePathnameMock.mockReturnValue(Links.introAbout)
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)

    const anchors = Array.from(
      container.querySelectorAll('.menu-wrap .gnb-main-trigger'),
    )
    expect(anchors.map((anchor) => anchor.textContent)).toEqual([
      '법인소개',
      '해커톤&아이디어톤',
      '컨퍼런스&프로그램',
      '공지사항',
      '안내 및 공시',
    ])
    anchors.forEach((anchor, index) => {
      expect(anchor).toHaveAttribute('href', `#mGnb-anchor${index + 1}`)
      expect(anchor).toHaveAttribute('aria-controls', `mGnb-anchor${index + 1}`)
    })
    expect(anchors[0]).toHaveClass('active')
    expect(anchors[1]).not.toHaveClass('active')

    // 구역 자체의 페이지가 없으므로 전체보기 링크는 만들지 않는다.
    expect(screen.queryByRole('link', { name: /전체보기/ })).toBeNull()
    expect(
      Array.from(
        container.querySelectorAll('#mGnb-anchor1 .gnb-sub-trigger'),
      ).map((link) => link.textContent),
    ).toEqual(IntroMenu.subMenus.map((subMenu) => subMenu.label))
    expect(
      container.querySelector('#mGnb-anchor1 .gnb-sub-trigger.selected'),
    ).toHaveTextContent('사단법인 에스티데브')
    expect(
      Array.from(
        container.querySelectorAll('#mGnb-anchor2 .gnb-sub-trigger'),
      ).map((link) => link.getAttribute('href')),
    ).toEqual(HackathonMenu.subMenus.map((subMenu) => subMenu.href))
    expect(
      Array.from(
        container.querySelectorAll('#mGnb-anchor3 .gnb-sub-trigger'),
      ).map((link) => link.getAttribute('href')),
    ).toEqual(ConferenceMenu.subMenus.map((subMenu) => subMenu.href))
    expect(
      container.querySelectorAll('#mGnb-anchor5 .gnb-sub-trigger'),
    ).toHaveLength(InfoMenu.subMenus.length)
    expect(
      container.querySelector('#mGnb-anchor5 .sub-title'),
    ).toHaveTextContent(InfoMenu.label)

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

  it('Escape 키를 누르면 모바일 내비게이션도 닫힌다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    const nav = container.querySelector('nav#mobile-nav') as HTMLElement

    await user.click(container.querySelector('button.btn-navi.all')!)
    expect(nav).toHaveClass('is-open')

    await user.keyboard('{Escape}')
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

  it('서랍 중간 항목에서는 Tab이 감싸지 않고 다음 항목으로 넘어간다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    await waitFor(() => expect(document.activeElement).toBe(drawer))
    const focusable = Array.from(
      drawer.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'),
    )

    focusable[1].focus()
    await user.keyboard('{Tab}')
    expect(document.activeElement).toBe(focusable[2])

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(focusable[1])
  })

  it('서랍이 열린 동안 포커스가 서랍 밖으로 빠지면 Tab이 서랍 안으로 끌어온다', async () => {
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    await waitFor(() => expect(document.activeElement).toBe(drawer))
    // 서랍으로 포커스를 다시 옮기는 예비 타이머(500ms)가 끝난 뒤에 확인한다.
    // 그때 이미 서랍 안에 있으므로 타이머는 포커스를 건드리지 않는다.
    await new Promise((resolve) => setTimeout(resolve, 550))
    expect(document.activeElement).toBe(drawer)

    const focusable = Array.from(
      drawer.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'),
    )

    ;(document.activeElement as HTMLElement).blur()
    expect(document.activeElement).toBe(document.body)
    await user.keyboard('{Tab}')
    expect(document.activeElement).toBe(focusable[0])

    ;(document.activeElement as HTMLElement).blur()
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(focusable[focusable.length - 1])
  })

  it('브레이크포인트 전에 포커스가 body로 떨어졌어도 직전 위치를 기준으로 옮긴다', async () => {
    usePathnameMock.mockReturnValue(Links.hackathonNews)
    const { cross } = stubBreakpoint()
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    await waitFor(() => expect(document.activeElement).toBe(drawer))
    const drawerLink = drawer.querySelector<HTMLElement>(
      `a[href="${Links.hackathonBlog}"]`,
    )!
    drawerLink.focus()
    // 브라우저가 감춰진 서랍의 포커스를 먼저 걷어낸 상황.
    drawerLink.blur()
    expect(document.activeElement).toBe(document.body)

    await cross(true)

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: '해커톤&아이디어톤' }),
    )
    vi.unstubAllGlobals()
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
    usePathnameMock.mockReturnValue(Links.noticesPress)
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

  it('안내 및 공시 경로에서는 데스크탑으로 넓어질 때 주 메뉴 첫 트리거로 옮긴다', async () => {
    // InfoMenu는 데스크탑 GNB에 없으므로 담당 트리거가 없다.
    usePathnameMock.mockReturnValue(Links.infoSitemap)
    const { cross } = stubBreakpoint()
    const { container, user } = renderWithChakra(<Header />)

    await user.click(container.querySelector('button.btn-navi.all')!)
    const drawer = container.querySelector('.gnb-wrap') as HTMLElement
    await waitFor(() => expect(document.activeElement).toBe(drawer))

    await cross(true)

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: '법인소개' }),
    )
    expect(document.activeElement).not.toBe(document.body)
    vi.unstubAllGlobals()
  })

  it('서랍에서 다른 구역을 둘러보던 중이면 그 구역의 트리거로 옮긴다', async () => {
    // 경로는 /intro/about 이지만 서랍에서 공지사항을 펼쳐 보고 있던 상황.
    usePathnameMock.mockReturnValue(Links.introAbout)
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

  it('서랍에서 안내 및 공시를 둘러보던 중이면 주 메뉴 첫 트리거로 옮긴다', async () => {
    usePathnameMock.mockReturnValue(Links.introAbout)
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
      screen.getByRole('button', { name: '법인소개' }),
    )
    expect(document.activeElement).not.toBe(document.body)
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

  it('모바일 좌측 목록의 active를 클릭한 패널에 맞춘다', async () => {
    usePathnameMock.mockReturnValue(Links.introAbout)
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

  it('해커톤 행사 소개 경로에서는 해커톤 구역의 행사 소개 메뉴만 현재 페이지로 표시한다', () => {
    usePathnameMock.mockReturnValue(Links.hackathon)
    const { container } = renderWithChakra(<Header />)

    const desktop = container.querySelector('.gnb-toggle-wrap') as HTMLElement
    const desktopActive = desktop.querySelectorAll('a.active')
    expect(desktopActive).toHaveLength(1)
    expect(desktopActive[0]).toHaveAttribute('href', Links.hackathon)
    expect(desktopActive[0]).toHaveAttribute('aria-current', 'page')
    expect(
      desktopActive[0].closest('.gnb-sub-list')!.querySelector('.sub-title'),
    ).toHaveTextContent(HackathonMenu.label)

    const mobileSelected = container.querySelectorAll(
      '.submenu-wrap a.selected',
    )
    expect(mobileSelected).toHaveLength(1)
    expect(mobileSelected[0].closest('#mGnb-anchor2')).not.toBeNull()

    // 같은 이름의 컨퍼런스 행사 소개 메뉴는 현재 페이지가 아니다.
    container
      .querySelectorAll(`a[href="${Links.conference}"]`)
      .forEach((link) => {
        expect(link).not.toHaveAttribute('aria-current')
        expect(link).not.toHaveClass('active')
        expect(link).not.toHaveClass('selected')
      })
  })

  it('메뉴 주소와 정확히 같은 경로에서는 그 하위 메뉴만 aria-current="page"로 표시한다', () => {
    usePathnameMock.mockReturnValue(Links.hackathonNews)
    const { container } = renderWithChakra(<Header />)

    const { desktop, mobile } = currentSubMenuLinks(container)

    expect(desktop).toHaveLength(1)
    expect(desktop[0]).toHaveTextContent('뉴스 기사')
    expect(desktop[0]).toHaveAttribute('href', Links.hackathonNews)
    expect(desktop[0]).toHaveAttribute('class', 'active')
    expect(desktop[0]).toHaveAttribute('aria-current', 'page')
    expect(sectionTitleOf(desktop[0])).toBe(HackathonMenu.label)

    expect(mobile).toHaveLength(1)
    expect(mobile[0]).toHaveTextContent('뉴스 기사')
    expect(mobile[0]).toHaveAttribute('href', Links.hackathonNews)
    expect(mobile[0]).toHaveAttribute('class', 'gnb-sub-trigger selected')
    expect(mobile[0]).toHaveAttribute('aria-current', 'page')
    expect(mobile[0].closest('#mGnb-anchor2')).not.toBeNull()

    // 접두사가 맞는 상위 '행사 소개'와 같은 이름의 컨퍼런스 메뉴는 표시하지 않는다.
    for (const href of [Links.hackathon, Links.conferenceNews]) {
      container
        .querySelectorAll(
          `.gnb-toggle-wrap a[href="${href}"], .submenu-wrap a[href="${href}"]`,
        )
        .forEach((link) => {
          expect(link).not.toHaveAttribute('aria-current')
          expect(link).not.toHaveClass('active')
          expect(link).not.toHaveClass('selected')
        })
    }
  })

  it('메뉴에 없는 행사 하위 경로에서는 가장 가까운 상위 메뉴(행사 소개)를 aria-current="location"으로 표시한다', () => {
    usePathnameMock.mockReturnValue('/hackathon/dsf26/faq')
    const { container } = renderWithChakra(<Header />)

    const { desktop, mobile } = currentSubMenuLinks(container)

    expect(desktop).toHaveLength(1)
    expect(desktop[0]).toHaveTextContent('행사 소개')
    expect(desktop[0]).toHaveAttribute('href', Links.hackathon)
    expect(desktop[0]).toHaveAttribute('class', 'active')
    // 그 페이지 자체가 아니라 그 아래에 있다는 뜻이므로 page가 아니다.
    expect(desktop[0]).toHaveAttribute('aria-current', 'location')
    expect(sectionTitleOf(desktop[0])).toBe(HackathonMenu.label)

    expect(mobile).toHaveLength(1)
    expect(mobile[0]).toHaveTextContent('행사 소개')
    expect(mobile[0]).toHaveAttribute('href', Links.hackathon)
    expect(mobile[0]).toHaveAttribute('class', 'gnb-sub-trigger selected')
    expect(mobile[0]).toHaveAttribute('aria-current', 'location')
    expect(mobile[0].closest('#mGnb-anchor2')).not.toBeNull()

    // 같은 이름의 컨퍼런스 '행사 소개'는 다른 구역이므로 표시하지 않는다.
    container
      .querySelectorAll(`a[href="${Links.conference}"]`)
      .forEach((link) => {
        expect(link).not.toHaveAttribute('aria-current')
        expect(link).not.toHaveClass('active')
        expect(link).not.toHaveClass('selected')
      })
    // 같은 주소를 가리키는 행사 참가하기 버튼은 메뉴 항목이 아니므로 현재 위치가 아니다.
    container
      .querySelectorAll('.header-actions a, .gnb-utils a')
      .forEach((link) => {
        expect(link).toHaveAttribute('href', Links.hackathon)
        expect(link).not.toHaveAttribute('aria-current')
      })
  })

  it('구역마다 정확한 주소는 page, 메뉴에 없는 하위 주소는 가장 긴 상위 메뉴의 location으로 표시한다', () => {
    const { container, rerender } = renderWithChakra(<Header />)

    for (const { pathname, href, current, section, anchor } of [
      {
        pathname: Links.introHistory,
        href: Links.introHistory,
        current: 'page',
        section: IntroMenu.label,
        anchor: 'mGnb-anchor1',
      },
      {
        // '행사 소개'(/hackathon)보다 더 긴 '뉴스 기사' 접두사가 이긴다.
        pathname: `${Links.hackathonNews}/2025-dsf`,
        href: Links.hackathonNews,
        current: 'location',
        section: HackathonMenu.label,
        anchor: 'mGnb-anchor2',
      },
      {
        pathname: '/conference/ai-summit',
        href: Links.conference,
        current: 'location',
        section: ConferenceMenu.label,
        anchor: 'mGnb-anchor3',
      },
      {
        pathname: Links.conferenceBlog,
        href: Links.conferenceBlog,
        current: 'page',
        section: ConferenceMenu.label,
        anchor: 'mGnb-anchor3',
      },
      {
        pathname: `${Links.noticesPress}/2025`,
        href: Links.noticesPress,
        current: 'location',
        section: NoticesMenu.label,
        anchor: 'mGnb-anchor4',
      },
    ]) {
      usePathnameMock.mockReturnValue(pathname)
      rerender(<Header />)

      const { desktop, mobile } = currentSubMenuLinks(container)
      expect(desktop).toHaveLength(1)
      expect(desktop[0]).toHaveAttribute('href', href)
      expect(desktop[0]).toHaveAttribute('aria-current', current)
      expect(sectionTitleOf(desktop[0])).toBe(section)

      expect(mobile).toHaveLength(1)
      expect(mobile[0]).toHaveAttribute('href', href)
      expect(mobile[0]).toHaveAttribute('aria-current', current)
      expect(mobile[0].closest('.gnb-sub-list')).toHaveAttribute('id', anchor)
    }
  })

  it('안내 및 공시 경로의 현재 위치는 그 구역이 있는 모바일 서랍에만 표시한다', () => {
    const { container, rerender } = renderWithChakra(<Header />)

    for (const [pathname, current] of [
      [Links.infoSitemap, 'page'],
      [`${Links.infoSitemap}/old`, 'location'],
    ]) {
      usePathnameMock.mockReturnValue(pathname)
      rerender(<Header />)

      const { desktop, mobile } = currentSubMenuLinks(container)
      // 데스크탑 GNB에는 안내 및 공시 구역이 없다.
      expect(desktop).toHaveLength(0)
      expect(mobile).toHaveLength(1)
      expect(mobile[0]).toHaveTextContent('사이트맵')
      expect(mobile[0]).toHaveAttribute('href', Links.infoSitemap)
      expect(mobile[0]).toHaveAttribute('aria-current', current)
      expect(mobile[0].closest('#mGnb-anchor5')).not.toBeNull()
    }
  })

  it('경로가 바뀌면 현재 위치 표시도 page와 location 사이를 따라 옮겨 간다', () => {
    usePathnameMock.mockReturnValue('/hackathon/dsf26')
    const { container, rerender } = renderWithChakra(<Header />)

    const eventIntro = container.querySelector(
      `.gnb-toggle-wrap a[href="${Links.hackathon}"]`,
    ) as HTMLElement
    const news = container.querySelector(
      `.gnb-toggle-wrap a[href="${Links.hackathonNews}"]`,
    ) as HTMLElement
    expect(eventIntro).toHaveAttribute('aria-current', 'location')
    expect(news).not.toHaveAttribute('aria-current')

    usePathnameMock.mockReturnValue(Links.hackathon)
    rerender(<Header />)
    expect(eventIntro).toHaveAttribute('aria-current', 'page')
    expect(eventIntro).toHaveClass('active')
    expect(news).not.toHaveAttribute('aria-current')

    usePathnameMock.mockReturnValue(Links.hackathonNews)
    rerender(<Header />)
    expect(eventIntro).not.toHaveAttribute('aria-current')
    expect(eventIntro).not.toHaveClass('active')
    expect(news).toHaveAttribute('aria-current', 'page')
    expect(news).toHaveClass('active')
  })

  it('어느 구역에도 속하지 않는 경로에서는 어떤 하위 메뉴도 현재 위치로 표시하지 않는다', () => {
    const { container, rerender } = renderWithChakra(<Header />)

    for (const pathname of [
      Links.root,
      '/hackathons',
      '/conference-old',
      '/business/hackathon',
      '/introduction',
      Links.admin,
      null,
    ]) {
      usePathnameMock.mockReturnValue(pathname as string)
      rerender(<Header />)

      const { desktop, mobile } = currentSubMenuLinks(container)
      expect(desktop).toHaveLength(0)
      expect(mobile).toHaveLength(0)
      expect(container.querySelector('a[aria-current]')).toBeNull()
    }
  })

  it('구역은 맞지만 해당하는 하위 메뉴가 없으면 트리거만 강조하고 하위 메뉴는 표시하지 않는다', () => {
    const { container, rerender } = renderWithChakra(<Header />)

    for (const [pathname, label] of [
      [NoticesMenu.path, NoticesMenu.label],
      [`${NoticesMenu.path}/unknown`, NoticesMenu.label],
      [IntroMenu.path, IntroMenu.label],
      [`${IntroMenu.path}/unknown/deep`, IntroMenu.label],
      [InfoMenu.path, InfoMenu.label],
    ]) {
      usePathnameMock.mockReturnValue(pathname)
      rerender(<Header />)

      // 구역 판별 자체는 되었는지 모바일 서랍의 구역 표시로 확인한다.
      expect(
        container.querySelector('.menu-wrap .gnb-main-trigger.active'),
      ).toHaveTextContent(label)

      const { desktop, mobile } = currentSubMenuLinks(container)
      expect(desktop).toHaveLength(0)
      expect(mobile).toHaveLength(0)
    }
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
