'use client'
import { toRecordTypeString } from '@/utils/prisma'
import { Select, SelectItem } from '@nextui-org/react'
import { RecordType } from '@prisma/client'
import { useState } from 'react'

export const recordTypes = [
  RecordType.REGULAR_BOARD_MEETING,
  RecordType.EXTRAORDINARY_BOARD_MEETING,
  RecordType.INAUGURAL_GENERAL_MEETING,
  RecordType.REGULAR_BOARD_MEETING,
  RecordType.EXTRAORDINARY_BOARD_MEETING,
]

export default function RecordTypeSelect() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedKeys, setSelectedKeys] = useState<any>(new Set([]))

  return (
    <>
      <input
        hidden
        name="recordType"
        value={Array.from(selectedKeys)[0] as string}
      />
      <Select
        className="max-w-xs"
        label="회의 유형"
        selectedKeys={selectedKeys}
        variant="bordered"
        onSelectionChange={setSelectedKeys}
      >
        {recordTypes.map((recordType) => (
          <SelectItem key={recordType}>
            {toRecordTypeString(recordType)}
          </SelectItem>
        ))}
      </Select>
    </>
  )
}
