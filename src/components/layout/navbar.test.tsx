import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen, within } from '@/tests/utils/render'
import Navigation from '@/components/layout/navbar'
import { Links } from '@/utils/links'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: ReactNode
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

describe('<Navigation>', () => {
  it('renders the home logo link to Links.root ("/")', () => {
    renderWithChakra(<Navigation />)
    const home = screen.getByRole('link', { name: '사단법인 STDev' })
    expect(home).toHaveAttribute('href', Links.root)
  })

  it('renders all three main menu trigger buttons', () => {
    renderWithChakra(<Navigation />)
    expect(
      screen.getByRole('button', { name: '법인소개', hidden: true }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '행사&프로그램', hidden: true }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '공지사항', hidden: true }),
    ).toBeInTheDocument()
  })

  it('renders the shop CTA link pointing to Links.shop', () => {
    renderWithChakra(<Navigation />)
    const shop = screen.getByRole('link', { name: '행사 참가하기' })
    expect(shop).toHaveAttribute('href', Links.shop)
    expect(shop.tagName).toBe('A')
  })

  it('renders the hamburger toggle with the accessible open label', () => {
    renderWithChakra(<Navigation />)
    const toggle = screen.getByRole('button', {
      name: '메뉴 열기',
      hidden: true,
    })
    expect(toggle).toBeInTheDocument()
  })

  it('does not render the mobile drawer on initial mount', () => {
    renderWithChakra(<Navigation />)
    expect(screen.queryByText('전체보기')).not.toBeInTheDocument()
  })

  it('renders exactly one shop link when the drawer is closed', () => {
    renderWithChakra(<Navigation />)
    expect(screen.getAllByRole('link', { name: '행사 참가하기' })).toHaveLength(
      1,
    )
  })

  it('renders a <header> landmark wrapping the nav content', () => {
    const { container } = renderWithChakra(<Navigation />)
    const header = container.querySelector('header')
    expect(header).not.toBeNull()
    const nav = header?.querySelector('nav')
    expect(nav).not.toBeNull()
  })

  it('opens the mobile drawer and toggles aria-label to "닫기" when hamburger clicked', async () => {
    const { user } = renderWithChakra(<Navigation />)
    const toggle = screen.getByRole('button', {
      name: '메뉴 열기',
      hidden: true,
    })
    await user.click(toggle)
    expect(
      screen.getByRole('button', { name: '닫기', hidden: true }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: '전체보기', hidden: true }),
    ).toHaveLength(3)
  })

  it('renders all sub-menu links with correct hrefs when drawer is open', async () => {
    const { user } = renderWithChakra(<Navigation />)
    await user.click(
      screen.getByRole('button', { name: '메뉴 열기', hidden: true }),
    )
    expect(
      screen.getByRole('link', { name: '연혁', hidden: true }),
    ).toHaveAttribute('href', Links.introHistory)
    expect(
      screen.getByRole('link', { name: '조직도', hidden: true }),
    ).toHaveAttribute('href', Links.introChart)
    expect(
      screen.getByRole('link', { name: '리더십', hidden: true }),
    ).toHaveAttribute('href', Links.introDirectors)
    expect(
      screen.getByRole('link', { name: '정관', hidden: true }),
    ).toHaveAttribute('href', Links.introArticles)
    expect(
      screen.getByRole('link', { name: '해커톤', hidden: true }),
    ).toHaveAttribute('href', Links.businessHackathon)
    expect(
      screen.getByRole('link', { name: '컨퍼런스', hidden: true }),
    ).toHaveAttribute('href', Links.businessConference)
    expect(
      screen.getByRole('link', { name: '뉴스 기사', hidden: true }),
    ).toHaveAttribute('href', Links.businessNews)
    expect(
      screen.getByRole('link', { name: '참여후기', hidden: true }),
    ).toHaveAttribute('href', Links.businessBlog)
    expect(
      screen.getByRole('link', { name: '보도자료', hidden: true }),
    ).toHaveAttribute('href', Links.noticesPress)
    expect(
      screen.getByRole('link', {
        name: '연간 기부금 모금액 및 활용실적',
        hidden: true,
      }),
    ).toHaveAttribute('href', Links.noticesDonation)
    expect(
      screen.getByRole('link', { name: '총회 및 이사회', hidden: true }),
    ).toHaveAttribute('href', Links.noticesRecords)
  })

  it('renders three "전체보기" links pointing to each main menu href in drawer', async () => {
    const { user } = renderWithChakra(<Navigation />)
    await user.click(
      screen.getByRole('button', { name: '메뉴 열기', hidden: true }),
    )
    const overview = screen.getAllByRole('link', {
      name: '전체보기',
      hidden: true,
    })
    const hrefs = overview.map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual([Links.intro, Links.business, Links.notices])
  })

  it('renders a second shop link inside the drawer when it is open', async () => {
    const { user } = renderWithChakra(<Navigation />)
    await user.click(
      screen.getByRole('button', { name: '메뉴 열기', hidden: true }),
    )
    const shopLinks = screen.getAllByRole('link', { name: '행사 참가하기' })
    expect(shopLinks).toHaveLength(2)
    shopLinks.forEach((anchor) => {
      expect(anchor).toHaveAttribute('href', Links.shop)
    })
  })

  it('closes the drawer when a mobile submenu item is clicked', async () => {
    const { user } = renderWithChakra(<Navigation />)
    await user.click(
      screen.getByRole('button', { name: '메뉴 열기', hidden: true }),
    )
    const link = screen.getByRole('link', { name: '연혁', hidden: true })
    const wrapperButton = link.closest('button')
    expect(wrapperButton).not.toBeNull()
    await user.click(wrapperButton as HTMLButtonElement)
    expect(
      screen.getByRole('button', { name: '메뉴 열기', hidden: true }),
    ).toBeInTheDocument()
    expect(screen.queryByText('전체보기')).not.toBeInTheDocument()
  })

  it('closes the drawer when the mobile shop button is clicked', async () => {
    const { user } = renderWithChakra(<Navigation />)
    await user.click(
      screen.getByRole('button', { name: '메뉴 열기', hidden: true }),
    )
    const shopButtons = screen.getAllByRole('button', {
      name: '행사 참가하기',
      hidden: true,
    })
    expect(shopButtons.length).toBeGreaterThanOrEqual(2)
    await user.click(shopButtons[shopButtons.length - 1])
    expect(
      screen.getByRole('button', { name: '메뉴 열기', hidden: true }),
    ).toBeInTheDocument()
  })

  it('toggles between open and closed state on successive hamburger clicks', async () => {
    const { user } = renderWithChakra(<Navigation />)
    const initial = screen.getByRole('button', {
      name: '메뉴 열기',
      hidden: true,
    })
    await user.click(initial)
    const opened = screen.getByRole('button', {
      name: '닫기',
      hidden: true,
    })
    expect(opened).toBeInTheDocument()
    await user.click(opened)
    expect(
      screen.getByRole('button', { name: '메뉴 열기', hidden: true }),
    ).toBeInTheDocument()
  })

  it('renders main menu labels in drawer sections when open', async () => {
    const { user } = renderWithChakra(<Navigation />)
    await user.click(
      screen.getByRole('button', { name: '메뉴 열기', hidden: true }),
    )
    expect(screen.getAllByText('법인소개').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('행사&프로그램').length).toBeGreaterThanOrEqual(
      2,
    )
    expect(screen.getAllByText('공지사항').length).toBeGreaterThanOrEqual(2)
  })

  describe('desktop dropdown menus', () => {
    it('opens the 법인소개 dropdown on trigger click and exposes sub-menu items', async () => {
      const { user } = renderWithChakra(<Navigation />)

      const trigger = screen.getByRole('button', {
        name: '법인소개',
        hidden: true,
      })
      await user.click(trigger)

      const history = await screen.findByRole('menuitem', {
        name: '연혁',
        hidden: true,
      })
      expect(history).toHaveAttribute('href', Links.introHistory)
      expect(
        await screen.findByRole('menuitem', { name: '조직도', hidden: true }),
      ).toHaveAttribute('href', Links.introChart)
      expect(
        await screen.findByRole('menuitem', { name: '리더십', hidden: true }),
      ).toHaveAttribute('href', Links.introDirectors)
      expect(
        await screen.findByRole('menuitem', { name: '정관', hidden: true }),
      ).toHaveAttribute('href', Links.introArticles)
    })

    it('renders a main "all" menu item inside the opened dropdown pointing to menu.href', async () => {
      const { user } = renderWithChakra(<Navigation />)
      await user.click(
        screen.getByRole('button', { name: '법인소개', hidden: true }),
      )

      const items = await screen.findAllByRole('menuitem', {
        name: '법인소개',
        hidden: true,
      })
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveAttribute('href', Links.intro)
    })

    it('opens the 행사&프로그램 dropdown with correct sub-menu hrefs', async () => {
      const { user } = renderWithChakra(<Navigation />)
      await user.click(
        screen.getByRole('button', { name: '행사&프로그램', hidden: true }),
      )

      expect(
        await screen.findByRole('menuitem', { name: '해커톤', hidden: true }),
      ).toHaveAttribute('href', Links.businessHackathon)
      expect(
        await screen.findByRole('menuitem', {
          name: '컨퍼런스',
          hidden: true,
        }),
      ).toHaveAttribute('href', Links.businessConference)
      expect(
        await screen.findByRole('menuitem', {
          name: '뉴스 기사',
          hidden: true,
        }),
      ).toHaveAttribute('href', Links.businessNews)
      expect(
        await screen.findByRole('menuitem', {
          name: '참여후기',
          hidden: true,
        }),
      ).toHaveAttribute('href', Links.businessBlog)
    })

    it('opens the 공지사항 dropdown with correct sub-menu hrefs', async () => {
      const { user } = renderWithChakra(<Navigation />)
      await user.click(
        screen.getByRole('button', { name: '공지사항', hidden: true }),
      )

      expect(
        await screen.findByRole('menuitem', {
          name: '보도자료',
          hidden: true,
        }),
      ).toHaveAttribute('href', Links.noticesPress)
      expect(
        await screen.findByRole('menuitem', {
          name: '연간 기부금 모금액 및 활용실적',
          hidden: true,
        }),
      ).toHaveAttribute('href', Links.noticesDonation)
      expect(
        await screen.findByRole('menuitem', {
          name: '총회 및 이사회',
          hidden: true,
        }),
      ).toHaveAttribute('href', Links.noticesRecords)
    })
  })

  describe('accessibility', () => {
    it('exposes aria-haspopup on each dropdown trigger', () => {
      renderWithChakra(<Navigation />)
      const triggers = [
        screen.getByRole('button', { name: '법인소개', hidden: true }),
        screen.getByRole('button', { name: '행사&프로그램', hidden: true }),
        screen.getByRole('button', { name: '공지사항', hidden: true }),
      ]
      triggers.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-haspopup')
      })
    })

    it('exposes a single <nav> landmark containing all dropdown triggers', () => {
      const { container } = renderWithChakra(<Navigation />)
      const nav = container.querySelector('nav')
      expect(nav).not.toBeNull()
      const scoped = within(nav as HTMLElement)
      expect(scoped.getAllByRole('button', { hidden: true })).toHaveLength(3)
    })

    it('gives the hamburger button an accessible name matching its state', async () => {
      const { user } = renderWithChakra(<Navigation />)
      const hamburger = screen.getByRole('button', {
        name: '메뉴 열기',
        hidden: true,
      })
      expect(hamburger).toHaveAccessibleName('메뉴 열기')

      await user.click(hamburger)
      const close = screen.getByRole('button', {
        name: '닫기',
        hidden: true,
      })
      expect(close).toHaveAccessibleName('닫기')
    })
  })
})
