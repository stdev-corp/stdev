import { redirect } from 'next/navigation'
import { signIn, providerMap, auth } from '@/utils/auth'
import { AuthError } from 'next-auth'
import { Links } from '@/utils/links'
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import Footer from '@/components/layout/footer'

function SignInError({ error }: { error: string | undefined }) {
  if (!error) return null

  let message = '알수 없는 에러입니다.'
  switch (error) {
    case 'OAuthAccountNotLinked':
      message = '이미 다른 소셜 로그인으로 가입된 계정입니다.'
      break
    case 'AccessDenied':
      message = '요청한 소셜 로그인을 처리하는데에 실패했습니다.'
      break
    case 'OAuthCallbackError':
      message = '요청한 소셜 로그인을 처리하는 도중 오류가 발생했습니다.'
      break
  }

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-md flex-col gap-4">
      <div>{message}</div>
      <div>에러 코드: {error}</div>
    </div>
  )
}

type Props = {
  searchParams: Promise<{
    callbackUrl: string | undefined
    error: string | undefined
  }>
}

export default async function SignInPage(props: Props) {
  let callbackUrl = (await props.searchParams).callbackUrl
  const error = (await props.searchParams).error

  if (!callbackUrl || callbackUrl === Links.signin) {
    callbackUrl = Links.home
  }

  const session = await auth()
  if (session) {
    return redirect(callbackUrl)
  }

  return (
    <>
      <div className="flex justify-center items-center h-screen">
        <Card className="min-w-[320px] p-4">
          <CardHeader className="flex flex-col">
            <h3>로그인</h3>
            <span>첫 로그인일 경우 자동으로 회원가입됩니다.</span>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-2">
              {Object.values(providerMap).map((provider) => (
                <form
                  key={provider.id}
                  action={async () => {
                    'use server'
                    try {
                      await signIn(provider.id, {
                        redirectTo: callbackUrl,
                      })
                    } catch (error) {
                      // Signin can fail for a number of reasons, such as the user
                      // not existing, or the user not having the correct role.
                      // In some cases, you may want to redirect to a custom error
                      if (error instanceof AuthError) {
                        return redirect(
                          `${Links.signin}?error=${error.type}&callbackUrl=${callbackUrl ?? ''}`,
                        )
                      }

                      // Otherwise if a redirects happens Next.js can handle it
                      // so you can just re-thrown the error and let Next.js handle it.
                      // Docs:
                      // https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
                      throw error
                    }
                  }}
                >
                  <Button type="submit" className="w-full" color="primary">
                    <span className="text-white">
                      Sign in with {provider.name}
                    </span>
                  </Button>
                </form>
              ))}
            </div>
          </CardBody>
          <CardFooter>
            <SignInError error={error} />
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </>
  )
}
