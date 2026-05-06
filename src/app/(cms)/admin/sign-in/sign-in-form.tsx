'use client'

import { useState } from 'react'
import { authClient } from '@/utils/auth-client'

export default function SignInForm() {
  const [error, setError] = useState<string | null>(null)

  async function signInWithGoogle() {
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/admin',
      errorCallbackURL: '/admin/sign-in',
    })
    if (result.error) {
      setError(result.error.message ?? '로그인에 실패했습니다.')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <button type="button" onClick={signInWithGoogle}>
        Google 계정으로 로그인
      </button>
      <p>관리자는 Google로 연결된 @stdev.kr 계정만 접근할 수 있습니다.</p>
      {error && <p>{error}</p>}
    </div>
  )
}
