'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Links } from '@/utils/links'
import Menus, { InfoMenu } from '@/utils/menus'

function anchorId(index: number) {
  return `mGnb-anchor${index + 1}`
}

export default function Header() {
  const pathname = usePathname()
  const [openGnb, setOpenGnb] = useState<string | null>(null)
  const [utilityOpen, setUtilityOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const openButtonRef = useRef<HTMLButtonElement>(null)

  const closeAll = useCallback(() => {
    setOpenGnb(null)
    setUtilityOpen(false)
    setMobileOpen(false)
  }, [])

  // 경로가 바뀌면 열려 있던 메뉴를 모두 닫는다. 이펙트 대신 렌더 중에
  // 상태를 조정하는 React 권장 패턴을 쓴다.
  const [renderedPathname, setRenderedPathname] = useState(pathname)
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname)
    setOpenGnb(null)
    setUtilityOpen(false)
    setMobileOpen(false)
  }

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

  const activeSection = Menus.find(
    (menu) =>
      pathname === menu.href ||
      pathname?.startsWith(`${menu.href}/`) ||
      menu.subMenus.some((subMenu) => subMenu.href === pathname),
  )

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
                        style={{ display: utilityOpen ? 'block' : 'none' }}
                      >
                        <div className="drop-in">
                          <ul className="drop-list">
                            {InfoMenu.subMenus.map((subMenu) => (
                              <li key={subMenu.href}>
                                <Link href={subMenu.href} className="item-link">
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
                        className={
                          open || activeSection?.label === menu.label
                            ? 'gnb-main-trigger active'
                            : 'gnb-main-trigger'
                        }
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
          <div className="gnb-wrap">
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
                    {[...Menus, InfoMenu].map((menu, index) => (
                      <li key={menu.label}>
                        <a
                          href={`#${anchorId(index)}`}
                          className={
                            activeSection?.label === menu.label
                              ? 'gnb-main-trigger active'
                              : 'gnb-main-trigger'
                          }
                          aria-controls={anchorId(index)}
                        >
                          {menu.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="submenu-wrap">
                  {[...Menus, InfoMenu].map((menu, index) => (
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
              onClick={() => {
                setMobileOpen(false)
                openButtonRef.current?.focus()
              }}
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
