import { describe, expect, it, vi } from 'vitest'
import { renderWithChakra, screen } from '@/tests/utils/render'
import { EntityList } from './entity-list'

type Item = { id: number; name: string }

function renderList(items: Item[] = [{ id: 1, name: '첫 항목' }]) {
  const deleteAction = vi.fn(async () => {})
  const createAction = vi.fn()
  const editAction = vi.fn()

  const result = renderWithChakra(
    <EntityList
      title="테스트 목록"
      description="목록 설명"
      items={items}
      emptyMessage="비어 있습니다"
      renderItem={(item) => <span>{item.name}</span>}
      renderCreate={(open, setOpen) => {
        if (open) createAction()
        return open ? (
          <button onClick={() => setOpen(false)}>생성 닫기</button>
        ) : null
      }}
      renderEdit={(item, open, closeEdit) => {
        if (open && item) editAction(item)
        return item ? (
          <button onClick={closeEdit}>{item.name} 수정 닫기</button>
        ) : null
      }}
      deleteAction={deleteAction}
      deleteLabel="테스트"
      addLabel="새 항목"
    />,
  )

  return { ...result, deleteAction, createAction, editAction }
}

describe('EntityList', () => {
  it('renders title, description, and item rows', () => {
    renderList()

    expect(
      screen.getByRole('heading', { name: '테스트 목록' }),
    ).toBeInTheDocument()
    expect(screen.getByText('목록 설명')).toBeInTheDocument()
    expect(screen.getByText('첫 항목')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 항목' })).toBeInTheDocument()
  })

  it('renders the empty message when there are no items', () => {
    renderList([])

    expect(screen.getByText('비어 있습니다')).toBeInTheDocument()
    expect(screen.queryByText('첫 항목')).not.toBeInTheDocument()
  })

  it('opens create and edit renderers and closes them through callbacks', async () => {
    const { user, createAction, editAction } = renderList()

    await user.click(screen.getByRole('button', { name: '새 항목' }))
    expect(createAction).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('button', { name: '생성 닫기' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '생성 닫기' }))
    expect(
      screen.queryByRole('button', { name: '생성 닫기' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '수정' }))
    expect(editAction).toHaveBeenCalledWith({ id: 1, name: '첫 항목' })
    expect(
      screen.getByRole('button', { name: '첫 항목 수정 닫기' }),
    ).toBeInTheDocument()
  })
})
