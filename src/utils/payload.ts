'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { Business, File, Image } from '@/generated/payload-types'

export async function queryInstitutions() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'institutions', // required
    depth: 2,
    page: 1,
    limit: 30,
  })

  const institutions = result.docs.map((institution) => {
    const logo = institution.logo as Image
    return {
      imageUrl: logo.url,
      imageAlt: logo.alt,
    }
  })

  return institutions
}

export async function queryWebpages(type: string) {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'webpages',
    where: {
      type: {
        equals: type,
      },
    },
    limit: 100,
    depth: 2,
  })
  return result.docs.map((doc) => {
    const { id, title, author, url, publishedDate, business } = doc
    return {
      id,
      title,
      author,
      url,
      publishedDate,
      business_name: (business as Business).name,
    }
  })
}

export async function queryReports(type: string) {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'reports',
    where: {
      type: {
        equals: type,
      },
    },
    limit: 100,
    depth: 2,
  })
  return result.docs.map((doc) => {
    const { id, title, publishedDate, file } = doc
    return {
      id,
      title,
      publishedDate,
      file_url: (file as File).url ?? '',
    }
  })
}

export async function getMarkdownByTitle(title: string) {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'markdowns',
    where: {
      title: {
        equals: title,
      },
    },
    limit: 1,
  })
  return result.docs[0]
}
