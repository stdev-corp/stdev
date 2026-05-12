import {
  resetNavigationMocks,
  routerPushMock,
  usePathnameMock,
} from '@/tests/mocks/navigation'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import SubMenuSelect from '@/components/layout/sub-menu-select'
import { IntroMenu, NoticesMenu } from '@/utils/menus'
import { Links } from '@/utils/links'

describe('<SubMenuSelect>', () => {
  beforeEach(() => {
    resetNavigationMocks()
    usePathnameMock.mockReturnValue('/')
  })

  it('renders a native <select> containing 1 main + 4 sub options for the Intro menu', () => {
    usePathnameMock.mockReturnValue(Links.intro)
    renderWithChakra(<SubMenuSelect menu={IntroMenu} />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select).toBeInTheDocument()

    const options = Array.from(select.options)
    expect(options).toHaveLength(5)

    expect(options[0]).toHaveValue(Links.intro)
    expect(options[0]).toHaveTextContent('법인소개')

    expect(options[1]).toHaveValue(Links.introHistory)
    expect(options[1]).toHaveTextContent('연혁')

    expect(options[2]).toHaveValue(Links.introChart)
    expect(options[2]).toHaveTextContent('조직도')

    expect(options[3]).toHaveValue(Links.introDirectors)
    expect(options[3]).toHaveTextContent('리더십')

    expect(options[4]).toHaveValue(Links.introArticles)
    expect(options[4]).toHaveTextContent('정관')
  })

  it('sets the select value to the current pathname when it matches a sub-menu', () => {
    usePathnameMock.mockReturnValue(Links.introHistory)
    renderWithChakra(<SubMenuSelect menu={IntroMenu} />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe(Links.introHistory)
  })

  it('sets the select value to the main menu href when pathname matches the root menu', () => {
    usePathnameMock.mockReturnValue(Links.intro)
    renderWithChakra(<SubMenuSelect menu={IntroMenu} />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe(Links.intro)
  })

  it('calls router.push when the user selects a different option', async () => {
    usePathnameMock.mockReturnValue(Links.intro)
    const { user } = renderWithChakra(<SubMenuSelect menu={IntroMenu} />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, Links.introChart)

    expect(routerPushMock).toHaveBeenCalledTimes(1)
    expect(routerPushMock).toHaveBeenCalledWith(Links.introChart)
  })

  it('calls router.push with the main href when user chooses the root option', async () => {
    usePathnameMock.mockReturnValue(Links.introHistory)
    const { user } = renderWithChakra(<SubMenuSelect menu={IntroMenu} />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, Links.intro)

    expect(routerPushMock).toHaveBeenCalledTimes(1)
    expect(routerPushMock).toHaveBeenCalledWith(Links.intro)
  })

  it('renders options for a different menu (Notices)', () => {
    usePathnameMock.mockReturnValue(Links.notices)
    renderWithChakra(<SubMenuSelect menu={NoticesMenu} />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    const options = Array.from(select.options).map((o) => ({
      value: o.value,
      label: o.textContent,
    }))

    expect(options).toEqual([
      { value: Links.notices, label: '공지사항' },
      { value: Links.noticesPress, label: '보도자료' },
      {
        value: Links.noticesDonation,
        label: '연간 기부금 모금액 및 활용실적',
      },
      { value: Links.noticesRecords, label: '총회 및 이사회' },
    ])
  })

  it('does not call router.push on initial render', () => {
    usePathnameMock.mockReturnValue(Links.intro)
    renderWithChakra(<SubMenuSelect menu={IntroMenu} />)

    expect(routerPushMock).not.toHaveBeenCalled()
  })
})
