import { Radio, RadioGroup } from '@nextui-org/radio'
import { WebpageType } from '@prisma/client'

export default function WebpageTypeSelect() {
  return (
    <RadioGroup
      name="type"
      label="웹페이지 유형"
      orientation="horizontal"
      className="flex flex-row gap-4"
    >
      <Radio value={WebpageType.PRESS_RELEASE}>보도 자료</Radio>
      <Radio value={WebpageType.NEWS_ARTICLE}>뉴스 기사</Radio>
      <Radio value={WebpageType.BLOG_POST}>블로그 글</Radio>
    </RadioGroup>
  )
}
