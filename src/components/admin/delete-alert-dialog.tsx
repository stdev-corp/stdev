'use client'

import { Button, Dialog, Portal } from '@chakra-ui/react'
import { useState, useTransition } from 'react'
import { toaster } from './toaster'

type Props = {
  action: (formData: FormData) => Promise<void>
  recordId: number
  label: string
  description?: string
  buttonSize?: 'xs' | 'sm' | 'md'
}

export function DeleteAlertDialog({
  action,
  recordId,
  label,
  description,
  buttonSize = 'sm',
}: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function confirmDelete() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('id', String(recordId))
      try {
        await action(formData)
        toaster.create({
          title: `${label} 항목을 삭제했습니다.`,
          type: 'success',
        })
        setOpen(false)
      } catch (error) {
        toaster.create({
          title: '삭제 실패',
          description: error instanceof Error ? error.message : String(error),
          type: 'error',
        })
      }
    })
  }

  return (
    <>
      <Button
        size={buttonSize}
        variant="ghost"
        colorPalette="red"
        onClick={() => setOpen(true)}
      >
        삭제
      </Button>
      <Dialog.Root
        role="alertdialog"
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{label} 삭제</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {description ??
                  '이 작업은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?'}
              </Dialog.Body>
              <Dialog.Footer gap={2}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  colorPalette="red"
                  onClick={confirmDelete}
                  loading={pending}
                >
                  삭제
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
