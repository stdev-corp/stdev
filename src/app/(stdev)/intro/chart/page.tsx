import Image from 'next/image'
import { Box } from '@chakra-ui/react'

export default async function ChartPage() {
  return (
    <>
      <h1>조직도</h1>
      <Box h="3rem" />
      <Image
        src="/images/intro/chart.png"
        alt="Organization Chart"
        width={800}
        height={800}
      />
      <Box h="3rem" />
    </>
  )
}
