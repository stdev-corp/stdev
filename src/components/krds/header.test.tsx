import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/tests/mocks/navigation'
import { resetNavigationMocks, usePathnameMock } from '@/tests/mocks/navigation'
import { renderWithChakra, screen } from '@/tests/utils/render'
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

  it('현재 경로가 속한 구역의 트리거에 active 클래스를 부여한다', () => {
    usePathnameMock.mockReturnValue(Links.businessHackathon)
    renderWithChakra(<Header />)

    expect(screen.getByRole('button', { name: '행사&프로그램' })).toHaveClass(
      'active',
    )
    expect(screen.getByRole('button', { name: '법인소개' })).not.toHaveClass(
      'active',
    )
    expect(screen.getByRole('button', { name: '공지사항' })).not.toHaveClass(
      'active',
    )
  })

  it('구역 최상위 경로에서도 해당 트리거가 active가 된다', () => {
    usePathnameMock.mockReturnValue(Links.notices)
    renderWithChakra(<Header />)

    expect(screen.getByRole('button', { name: '공지사항' })).toHaveClass(
      'active',
    )
    expect(
      screen.getByRole('button', { name: '행사&프로그램' }),
    ).not.toHaveClass('active')
  })

  it('경로가 없으면 어떤 트리거도 active가 아니다', () => {
    usePathnameMock.mockReturnValue(null as unknown as string)
    renderWithChakra(<Header />)

    for (const label of ['법인소개', '행사&프로그램', '공지사항']) {
      expect(screen.getByRole('button', { name: label })).not.toHaveClass(
        'active',
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
      'active',
    )
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
