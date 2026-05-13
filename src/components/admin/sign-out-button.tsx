'use client'

import { Button } from '@chakra-ui/react'
import { useTransition } from 'react'
import { authClient } from '@/utils/auth-client'

export function SignOutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant="outline"
      colorPalette="red"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut()
          window.location.href = '/admin/sign-in'
        })
      }
    >
      로그아웃
    </Button>
  )
}
