import { prisma } from '../prisma'

export interface UserAgent {
  isBot: boolean
  ua: string
  browser: {
    name?: string
    version?: string
    major?: string
  }
  device: {
    model?: string
    type?: string
    vendor?: string
  }
  engine: {
    name?: string
    version?: string
  }
  os: {
    name?: string
    version?: string
  }
  cpu: {
    architecture?: string
  }
}

export async function logUrlEvent(slug: string, ua: UserAgent) {
  await prisma.urlEvent.create({
    data: {
      url: slug,
      ua: ua.ua,
      isBot: ua.isBot,
      browserName: ua.browser.name,
      deviceModel: ua.device.model,
      deviceType: ua.device.type,
      deviceVendor: ua.device.vendor,
      engineName: ua.engine.name,
      osName: ua.os.name,
      cpuArch: ua.cpu.architecture,
    },
  })
}
