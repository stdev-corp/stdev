export function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function optionalText(formData: FormData, key: string) {
  const value = text(formData, key)
  return value.length > 0 ? value : null
}

export function date(formData: FormData, key: string) {
  const value = text(formData, key)
  if (!value) {
    throw new Error(`${key} is required`)
  }
  return new Date(value)
}

export function optionalNumber(formData: FormData, key: string) {
  const value = text(formData, key)
  return value ? Number(value) : null
}

export function requiredNumber(formData: FormData, key: string) {
  const value = optionalNumber(formData, key)
  if (!value) {
    throw new Error(`${key} is required`)
  }
  return value
}

export function recordId(formData: FormData) {
  return requiredNumber(formData, 'id')
}
