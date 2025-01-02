import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault('Asia/Seoul')

export function toDateTimeString(date?: Date | null): string {
  if (!date) {
    return 'N/A'
  }
  return dayjs(date).format('YYYY년 M월 D일 H:mm:ss')
}
