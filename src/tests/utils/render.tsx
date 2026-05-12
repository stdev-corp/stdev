import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'

function AllProviders({ children }: { children: ReactNode }) {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
}

export function renderWithChakra(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult & { user: UserEvent } {
  const user = userEvent.setup()
  const result = render(ui, { wrapper: AllProviders, ...options })
  return { ...result, user }
}

export async function renderAsyncServerComponent(
  component: () => Promise<ReactElement> | ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): Promise<RenderResult & { user: UserEvent }> {
  const resolved = await component()
  return renderWithChakra(resolved, options)
}

export * from '@testing-library/react'
export { userEvent }
