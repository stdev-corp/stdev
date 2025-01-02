import { listUsers } from '@/utils/server/user'
import UsersTable from './table'

export default async function AdminUsersPage() {
  const data = await listUsers()

  return (
    <>
      <h1 className="text-xl mb-8">사용자</h1>
      <UsersTable users={data} />
    </>
  )
}
