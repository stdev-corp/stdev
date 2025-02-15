import { Links } from '@/utils/links'
import { redirect } from 'next/navigation'

export default function BuyPage() {
  redirect(Links.products)
}
