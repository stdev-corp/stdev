import SignInForm from './sign-in-form'

export default function SignInPage() {
  return (
    <main style={{ margin: '80px auto', maxWidth: 360 }}>
      <h1>CMS 로그인</h1>
      <p>STDev Google 계정으로 로그인하세요.</p>
      <SignInForm />
    </main>
  )
}
