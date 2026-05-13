'use client'

import { Button, CloseButton, Drawer, Portal, Stack } from '@chakra-ui/react'
import { useTransition, type ReactNode } from 'react'
import { toaster } from './toaster'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  action: (formData: FormData) => Promise<void>
  children: ReactNode
  successMessage?: string
  formKey?: string | number
}

export function FormDrawer({
  open,
  onOpenChange,
  title,
  action,
  children,
  successMessage,
  formKey,
}: Props) {
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData)
        toaster.create({
          title: successMessage ?? '저장되었습니다.',
          type: 'success',
        })
        onOpenChange(false)
      } catch (error) {
        toaster.create({
          title: '저장 실패',
          description: error instanceof Error ? error.message : String(error),
          type: 'error',
        })
      }
    })
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="end"
      size="md"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>{title}</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" position="absolute" top={3} right={3} />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <form
              key={formKey}
              action={submit}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <Drawer.Body>
                <Stack gap={4}>{children}</Stack>
              </Drawer.Body>
              <Drawer.Footer gap={2}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={pending}
                >
                  취소
                </Button>
                <Button type="submit" colorPalette="teal" loading={pending}>
                  저장
                </Button>
              </Drawer.Footer>
            </form>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
