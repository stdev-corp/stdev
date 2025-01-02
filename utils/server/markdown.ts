import { prisma } from '@/utils/prisma'

export async function getMarkdownByTitle(title: string) {
  const data = await prisma.markdown.findFirst({
    where: { title },
  })
  return data
}

type CreateMarkdownData = {
  category: string
  title: string
  subtitle: string
  content: string
}

export async function createMarkdown(data: CreateMarkdownData) {
  const result = await prisma.markdown.create({
    data,
  })
  return result
}
