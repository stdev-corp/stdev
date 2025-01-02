'use client'
import { CircularProgress } from '@nextui-org/progress'

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <CircularProgress size="lg" />
    </div>
  )
}
