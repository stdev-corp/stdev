'use client'

import { Alert, Button, Stack } from '@chakra-ui/react'
import { useState, useTransition } from 'react'
import { authClient } from '@/utils/auth-client'

export default function SignInForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function signInWithGoogle() {
    setError(null)
    startTransition(async () => {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/admin',
        errorCallbackURL: '/admin/sign-in',
      })
      if (result.error) {
        setError(result.error.message ?? '로그인에 실패했습니다.')
      }
    })
  }

  return (
    <Stack gap={3}>
      <Button
        type="button"
        colorPalette="teal"
        loading={pending}
        onClick={signInWithGoogle}
      >
        Google 계정으로 로그인
      </Button>
      {error && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}
    </Stack>
  )
}
