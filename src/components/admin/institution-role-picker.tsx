'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react'
import type { Institution } from '@prisma/client'
import { useState } from 'react'
import type { BusinessRole } from '@/utils/cms-types'
import { ROLE_LABELS, ROLE_ORDER } from '@/utils/events'

type Props = {
  institutions: Pick<Institution, 'id' | 'nameKo'>[]
  /** 역할별로 이미 연결된 기관 ID. 배열 순서가 표시 순서다. */
  defaultValue: Record<BusinessRole, number[]>
}

/**
 * 주최·주관·후원·협력 기관을 역할별로 고르고 순서를 정한다. 고른 결과는
 * role_host 같은 숨은 입력에 쉼표로 이어 서버 액션으로 보낸다.
 */
export function InstitutionRolePicker({ institutions, defaultValue }: Props) {
  const [selected, setSelected] = useState(defaultValue)

  function update(role: BusinessRole, ids: number[]) {
    setSelected((current) => ({ ...current, [role]: ids }))
  }

  function nameOf(id: number) {
    return (
      institutions.find((institution) => institution.id === id)?.nameKo ??
      `#${id}`
    )
  }

  return (
    <Stack gap={4}>
      {ROLE_ORDER.map((role) => {
        const ids = selected[role]
        const available = institutions.filter(
          (institution) => !ids.includes(institution.id),
        )
        return (
          <Box key={role}>
            <input type="hidden" name={`role_${role}`} value={ids.join(',')} />
            <Text fontWeight="medium" mb={2}>
              {ROLE_LABELS[role]}
            </Text>
            <Stack gap={1} mb={2}>
              {ids.length === 0 && (
                <Text fontSize="sm" color="gray.500">
                  선택한 기관이 없습니다.
                </Text>
              )}
              {ids.map((id, index) => (
                <Flex key={id} gap={2} align="center">
                  <Badge>{index + 1}</Badge>
                  <Text flex="1" fontSize="sm">
                    {nameOf(id)}
                  </Text>
                  <Button
                    size="2xs"
                    variant="outline"
                    aria-label={`${ROLE_LABELS[role]} ${nameOf(id)} 위로`}
                    disabled={index === 0}
                    onClick={() => {
                      const next = [...ids]
                      ;[next[index - 1], next[index]] = [
                        next[index],
                        next[index - 1],
                      ]
                      update(role, next)
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    size="2xs"
                    variant="outline"
                    aria-label={`${ROLE_LABELS[role]} ${nameOf(id)} 아래로`}
                    disabled={index === ids.length - 1}
                    onClick={() => {
                      const next = [...ids]
                      ;[next[index + 1], next[index]] = [
                        next[index],
                        next[index + 1],
                      ]
                      update(role, next)
                    }}
                  >
                    ↓
                  </Button>
                  <Button
                    size="2xs"
                    variant="outline"
                    colorPalette="red"
                    aria-label={`${ROLE_LABELS[role]} ${nameOf(id)} 빼기`}
                    onClick={() =>
                      update(
                        role,
                        ids.filter((value) => value !== id),
                      )
                    }
                  >
                    빼기
                  </Button>
                </Flex>
              ))}
            </Stack>
            <NativeSelect.Root size="sm">
              <NativeSelect.Field
                aria-label={`${ROLE_LABELS[role]} 기관 추가`}
                value=""
                onChange={(event) => {
                  const id = Number(event.target.value)
                  if (id) {
                    update(role, [...ids, id])
                  }
                }}
              >
                <option value="">{ROLE_LABELS[role]} 기관 추가…</option>
                {available.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.nameKo}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>
        )
      })}
    </Stack>
  )
}
