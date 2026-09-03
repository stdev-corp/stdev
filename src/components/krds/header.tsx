'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Links } from '@/utils/links'
import Menus, { AllMenus, InfoMenu, findMenuSection } from '@/utils/menus'

function anchorId(index: number) {
  return `mGnb-anchor${index + 1}`
}

export default function Header() {
  const pathname = usePathname()
  const [openGnb, setOpenGnb] = useState<string | null>(null)
  const [utilityOpen, setUtilityOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const utilityButtonRef = useRef<HTMLButtonElement>(null)
  // 브레이크포인트가 바뀌는 시점에는 브라우저가 이미 감춰진 요소의 포커스를
  // 걷어낸 뒤라 activeElement로는 어디에 있었는지 알 수 없다. 직전 위치를 남긴다.
  const lastFocusedRef = useRef<Element | null>(null)
  const utilityMenuRef = useRef<HTMLDivElement>(null)
  const gnbTriggerRefs = useRef(new Map<string, HTMLButtonElement | null>())
  const gnbPanelRefs = useRef(new Map<string, HTMLDivElement | null>())
  // 모바일 서랍에서 지금 보고 있는 패널. null이면 현재 경로의 구역을 따른다.
  const [mobileSection, setMobileSection] = useState<string | null>(null)

  // 모바일 서랍은 InfoMenu까지 보여주므로 구역 판별도 같은 집합으로 한다.
  const activeSection = findMenuSection(pathname)

  const closeAll = useCallback(() => {
    setOpenGnb(null)
    setUtilityOpen(false)
    setMobileOpen(false)
    setMobileSection(null)
  }, [])

  // 경로가 바뀌면 열려 있던 메뉴를 모두 닫는다. 이펙트 대신 렌더 중에
  // 상태를 조정하는 React 권장 패턴을 쓴다.
  const [renderedPathname, setRenderedPathname] = useState(pathname)
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname)
    setOpenGnb(null)
    setUtilityOpen(false)
    setMobileOpen(false)
    setMobileSection(null)
  }

  /*
   * KRDS 전환점(1024px)을 넘으면 CSS가 반대편 메뉴를 감춰 버린다. 상태를 그대로
   * 두면 감춰진 서랍의 inert와 스크롤 잠금이 남아 페이지를 조작할 수 없다.
   *
   * 감춰지는 영역 안에 포커스가 있었다면 그대로 두면 <body>로 떨어지므로,
   * 새 레이아웃에서 같은 역할을 하는 컨트롤로 옮긴다. 그 밖의 위치에 있던
   * 포커스는 리사이즈만으로 빼앗지 않는다.
   */
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      lastFocusedRef.current =
        event.target instanceof Element ? event.target : null
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }, [])

  const sectionLabel = activeSection?.label ?? null

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')

    const onChange = (event: MediaQueryListEvent) => {
      // 1024px 이상은 서랍과 전체메뉴 버튼을, 미만은 데스크탑 GNB와 유틸리티
      // 영역을 감춘다.
      const hiddenByNewLayout = event.matches
        ? '.krds-main-menu-mobile, .btn-navi.all'
        : '.krds-main-menu, .header-utility'
      const active = document.activeElement
      // 이미 <body>로 떨어졌다면 직전 위치를 기준으로 판단한다.
      const focused =
        active instanceof Element && active !== document.body
          ? active
          : lastFocusedRef.current
      const losesFocus = focused?.closest(hiddenByNewLayout) != null

      // 상태와 inert 해제를 먼저 반영해야 새 컨트롤에 포커스가 들어간다.
      flushSync(() => closeAll())

      if (!losesFocus) {
        return
      }

      /*
       * 데스크탑에서 각 구역을 담당하는 컨트롤로 보낸다.
       * 안내 및 공시는 데스크탑 GNB에 없고 헤더 유틸리티 드롭다운이 대신하므로
       * 그 버튼으로 가야 한다. 현재 구역이 없으면(홈) 주 메뉴의 첫 트리거로 간다.
       */
      const target = event.matches
        ? sectionLabel === InfoMenu.label
          ? utilityButtonRef.current
          : ((sectionLabel ? gnbTriggerRefs.current.get(sectionLabel) : null) ??
            document.querySelector<HTMLElement>(
              '#krds-header .krds-main-menu .gnb-main-trigger',
            ))
        : openButtonRef.current
      target?.focus()
    }

    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [closeAll, sectionLabel])

  // KRDS 스크립트와 동일하게 body에 상태 클래스를 붙여 배경 스크롤을 잠근다.
  useEffect(() => {
    document.body.classList.toggle('is-gnb-web', openGnb !== null)
    document.body.classList.toggle('is-gnb-mobile', mobileOpen)
    return () => {
      document.body.classList.remove('is-gnb-web')
      document.body.classList.remove('is-gnb-mobile')
    }
  }, [openGnb, mobileOpen])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAll()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeAll])

  // 데스크탑 GNB 패널이 닫힐 때, 포커스가 그 안에 있었다면 트리거로 되돌린다.
  useEffect(() => {
    if (openGnb === null) {
      return
    }
    const label = openGnb
    // Map 인스턴스 자체는 바뀌지 않지만, 정리 시점에 참조하도록 지역에 담는다.
    const panels = gnbPanelRefs.current
    const triggers = gnbTriggerRefs.current
    return () => {
      const panel = panels.get(label)
      if (
        panel?.contains(document.activeElement) ||
        document.activeElement === document.body
      ) {
        triggers.get(label)?.focus()
      }
    }
  }, [openGnb])

  // 유틸리티 드롭다운도 동일하게 처리한다.
  useEffect(() => {
    if (!utilityOpen) {
      return
    }
    const menu = utilityMenuRef.current
    const button = utilityButtonRef.current
    return () => {
      if (
        menu?.contains(document.activeElement) ||
        document.activeElement === document.body
      ) {
        button?.focus()
      }
    }
  }, [utilityOpen])

  // 모바일 서랍이 열리면 KRDS 스크립트와 동일하게 나머지 화면을 inert 처리하고
  // 포커스를 서랍 안으로 옮긴다. 닫을 때의 포커스 복원은 closeAll이 맡는다.
  useEffect(() => {
    if (!mobileOpen) {
      return
    }

    const drawer = drawerRef.current
    const opener = openButtonRef.current
    // 서랍은 <header> 안에 있으므로, 헤더의 나머지(.header-in)와 #wrap의
    // 형제 영역(스킵 링크 / 본문 / 푸터)을 모두 격리한다. 목록을 열거하지 않고
    // 훑어서, 나중에 형제가 늘어도 빠지지 않게 한다.
    const header = document.getElementById('krds-header')
    const wrap = document.getElementById('wrap')
    const outside = [
      ...(wrap ? Array.from(wrap.children) : []),
      document.querySelector('#krds-header .header-in'),
    ].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== header,
    )

    outside.forEach((element) => element.setAttribute('inert', ''))

    /*
     * 서랍으로 포커스를 옮기는 시점이 까다롭다.
     * - 같은 틱에 focus()를 부르면 브라우저가 inert 요소의 포커스를 비동기로
     *   걷어내면서 덮어쓴다.
     * - KRDS는 visibility까지 0.4초 전환에 묶어 두므로 그 전까지는 서랍이
     *   visibility:hidden 이라 focus()가 무시된다.
     * 그래서 KRDS 스크립트와 동일하게 전환이 끝난 뒤 옮기되, 전환이 없는
     * 환경(reduced motion, 테스트)을 위해 프레임과 타이머로도 시도한다.
     * 이미 서랍 안에 포커스가 있으면 건드리지 않는다.
     */
    const focusDrawer = () => {
      if (drawer && !drawer.contains(document.activeElement)) {
        drawer.focus()
      }
    }
    const focusFrame = requestAnimationFrame(focusDrawer)
    const focusTimer = window.setTimeout(focusDrawer, 500)
    const nav = drawer?.closest('.krds-main-menu-mobile')
    nav?.addEventListener('transitionend', focusDrawer)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !drawer) {
        return
      }

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'),
      )
      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      // 포커스가 서랍 밖(또는 body)에 있으면 먼저 서랍 안으로 끌어온다.
      if (!(active instanceof Node) || !drawer.contains(active)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
        return
      }

      if (event.shiftKey && (active === first || active === drawer)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(focusFrame)
      window.clearTimeout(focusTimer)
      nav?.removeEventListener('transitionend', focusDrawer)
      document.removeEventListener('keydown', onKeyDown)
      // 어떤 경로로 닫히든(닫기 버튼 / Escape / 링크 이동) 포커스를 열었던
      // 버튼으로 되돌린다. inert를 먼저 걷어내야 focus()가 먹힌다.
      const hadFocusInside =
        drawer?.contains(document.activeElement) ||
        document.activeElement === document.body
      outside.forEach((element) => element.removeAttribute('inert'))
      if (hadFocusInside) {
        opener?.focus()
      }
    }
  }, [mobileOpen])

  /*
   * 좌측 1Depth 목록의 active는 사용자가 고른 패널을 가리킨다.
   *
   * KRDS 스크립트는 스크롤 위치로 동기화하지만, 서랍의 스크롤 여유가 짧아
   * 뒤쪽 구역은 앵커로 이동해도 맨 위에 닿지 못한다. 그 상태에서 스크롤 기준으로
   * 계산하면 방금 누른 구역이 아닌 앞 구역이 강조되어 클릭과 어긋난다.
   * 그래서 클릭한 구역을 그대로 유지한다.
   */
  // 서랍을 조작하기 전에는 현재 경로의 구역을 가리킨다.
  const currentMobileSection = mobileSection ?? activeSection?.label ?? null

  return (
    <>
      <header id="krds-header">
        <div className="header-in">
          <div className="header-container">
            <div className="inner">
              <div className="header-utility">
                <ul className="utility-list">
                  <li>
                    <div className="krds-drop-wrap drop-right">
                      <button
                        type="button"
                        ref={utilityButtonRef}
                        className={
                          utilityOpen
                            ? 'krds-btn small text drop-btn active'
                            : 'krds-btn small text drop-btn'
                        }
                        aria-expanded={utilityOpen}
                        onClick={() => setUtilityOpen((open) => !open)}
                      >
                        {InfoMenu.label}
                        <i className="svg-icon ico-toggle" aria-hidden="true" />
                      </button>
                      <div
                        className="drop-menu"
                        ref={utilityMenuRef}
                        style={{ display: utilityOpen ? 'block' : 'none' }}
                      >
                        <div className="drop-in">
                          <ul className="drop-list">
                            {InfoMenu.subMenus.map((subMenu) => (
                              <li key={subMenu.href}>
                                <Link
                                  href={subMenu.href}
                                  className={
                                    pathname === subMenu.href
                                      ? 'item-link active'
                                      : 'item-link'
                                  }
                                  aria-current={
                                    pathname === subMenu.href
                                      ? 'page'
                                      : undefined
                                  }
                                  onClick={closeAll}
                                >
                                  {subMenu.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="header-branding">
                <h2 className="logo">
                  <Link href={Links.root}>사단법인 STDev</Link>
                </h2>
                <div className="header-actions">
                  <a
                    href={Links.shop}
                    className="krds-btn small primary"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="새 창 열림"
                  >
                    행사 참가하기
                  </a>
                  <button
                    type="button"
                    ref={openButtonRef}
                    className="btn-navi all"
                    aria-controls="mobile-nav"
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen(true)}
                  >
                    전체메뉴
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 메인메뉴 : 데스크탑 */}
          <nav className="krds-main-menu" aria-label="주 메뉴">
            <div className="inner">
              <ul className="gnb-menu">
                {Menus.map((menu) => {
                  const open = openGnb === menu.label
                  return (
                    <li key={menu.label}>
                      <button
                        type="button"
                        ref={(node) => {
                          gnbTriggerRefs.current.set(menu.label, node)
                        }}
                        className={[
                          'gnb-main-trigger',
                          // KRDS의 active는 화살표를 180도 돌리므로 펼침 상태에만 쓴다.
                          open ? 'active' : '',
                          // 현재 구역 밑줄은 별도 클래스로 표시한다.
                          activeSection?.label === menu.label
                            ? 'is-current'
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-expanded={open}
                        onClick={() =>
                          setOpenGnb((current) =>
                            current === menu.label ? null : menu.label,
                          )
                        }
                      >
                        {menu.label}
                      </button>
                      <div
                        ref={(node) => {
                          gnbPanelRefs.current.set(menu.label, node)
                        }}
                        className={
                          open ? 'gnb-toggle-wrap is-open' : 'gnb-toggle-wrap'
                        }
                      >
                        <div className="gnb-main-list">
                          <div className="gnb-sub-list single-list">
                            <div className="gnb-sub-content">
                              <h2 className="sub-title">
                                {menu.label}
                                <Link
                                  href={menu.href}
                                  className="krds-btn link basic small"
                                  aria-current={
                                    pathname === menu.href ? 'page' : undefined
                                  }
                                  onClick={closeAll}
                                >
                                  <span className="underline">바로가기</span>
                                  <i
                                    className="svg-icon ico-angle right"
                                    aria-hidden="true"
                                  />
                                </Link>
                              </h2>
                              <ul>
                                {menu.subMenus.map((subMenu) => (
                                  <li key={subMenu.href}>
                                    <Link
                                      href={subMenu.href}
                                      className={
                                        pathname === subMenu.href
                                          ? 'active'
                                          : undefined
                                      }
                                      aria-current={
                                        pathname === subMenu.href
                                          ? 'page'
                                          : undefined
                                      }
                                      onClick={closeAll}
                                    >
                                      {subMenu.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>
        </div>

        {/* 메인메뉴 : 모바일 */}
        <nav
          id="mobile-nav"
          className={
            mobileOpen
              ? 'krds-main-menu-mobile is-backdrop is-open'
              : 'krds-main-menu-mobile'
          }
          aria-label="전체 메뉴"
          aria-hidden={!mobileOpen}
        >
          <div className="gnb-wrap" ref={drawerRef} tabIndex={-1}>
            <div className="gnb-header">
              <div className="gnb-utils">
                <ul className="utility-list">
                  <li>
                    <a
                      href={Links.shop}
                      className="krds-btn xsmall text"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="새 창 열림"
                      onClick={closeAll}
                    >
                      행사 참가하기
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="gnb-body">
              <div className="gnb-menu">
                <div className="menu-wrap">
                  <ul>
                    {AllMenus.map((menu, index) => (
                      <li key={menu.label}>
                        <a
                          href={`#${anchorId(index)}`}
                          className={
                            currentMobileSection === menu.label
                              ? 'gnb-main-trigger active'
                              : 'gnb-main-trigger'
                          }
                          aria-controls={anchorId(index)}
                          onClick={() => setMobileSection(menu.label)}
                        >
                          {menu.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="submenu-wrap">
                  {AllMenus.map((menu, index) => (
                    <div
                      className="gnb-sub-list"
                      id={anchorId(index)}
                      key={menu.label}
                    >
                      <h2 className="sub-title">{menu.label}</h2>
                      <ul>
                        {menu.href !== Links.root && (
                          <li>
                            <Link
                              href={menu.href}
                              className={
                                pathname === menu.href
                                  ? 'gnb-sub-trigger selected'
                                  : 'gnb-sub-trigger'
                              }
                              aria-current={
                                pathname === menu.href ? 'page' : undefined
                              }
                              onClick={closeAll}
                            >
                              {menu.label} 전체보기
                            </Link>
                          </li>
                        )}
                        {menu.subMenus.map((subMenu) => (
                          <li key={subMenu.href}>
                            <Link
                              href={subMenu.href}
                              className={
                                pathname === subMenu.href
                                  ? 'gnb-sub-trigger selected'
                                  : 'gnb-sub-trigger'
                              }
                              aria-current={
                                pathname === subMenu.href ? 'page' : undefined
                              }
                              onClick={closeAll}
                            >
                              {subMenu.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="krds-btn medium icon"
              id="close-nav"
              onClick={closeAll}
            >
              <span className="sr-only">전체메뉴 닫기</span>
              <i className="svg-icon ico-popup-close" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      {/*
        KRDS 스크립트는 딤을 body 끝에 붙인다. 헤더(z-index 70) 안에 두면
        같은 쌓임 맥락에서 드롭다운을 덮으므로 반드시 헤더 바깥에 그린다.
      */}
      {openGnb !== null && (
        <button
          type="button"
          className="gnb-backdrop active"
          aria-label="메뉴 닫기"
          onClick={() => setOpenGnb(null)}
        />
      )}
    </>
  )
}
