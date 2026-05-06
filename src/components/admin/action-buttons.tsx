type Props = {
  deleteAction: (formData: FormData) => Promise<void>
}

export function AdminActionButtons({ deleteAction }: Props) {
  return (
    <>
      <button type="submit">수정</button>
      <button formAction={deleteAction}>삭제</button>
    </>
  )
}
