import { Links } from '@/utils/links'
import { redirect } from 'next/navigation'

export default async function Page() {
  redirect(Links.home)
}
