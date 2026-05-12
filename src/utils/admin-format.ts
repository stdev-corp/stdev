import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Seoul')

export function dateValue(date: Date) {
  return dayjs(date).tz('Asia/Seoul').format('YYYY-MM-DD')
}
