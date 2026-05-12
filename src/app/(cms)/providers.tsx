'use client'

import {
  ChakraProvider,
  Portal,
  Spinner,
  Stack,
  Toast,
  Toaster as ChakraToaster,
  defaultSystem,
} from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { toaster } from '@/components/admin/toaster'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
      {children}
      <Portal>
        <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
          {(toast) => (
            <Toast.Root width={{ md: 'sm' }}>
              {toast.type === 'loading' ? (
                <Spinner size="sm" color="blue.solid" />
              ) : (
                <Toast.Indicator />
              )}
              <Stack gap="1" flex="1" maxWidth="100%">
                {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
                {toast.description && (
                  <Toast.Description>{toast.description}</Toast.Description>
                )}
              </Stack>
              {toast.action && (
                <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
              )}
              {toast.closable && <Toast.CloseTrigger />}
            </Toast.Root>
          )}
        </ChakraToaster>
      </Portal>
    </ChakraProvider>
  )
}
