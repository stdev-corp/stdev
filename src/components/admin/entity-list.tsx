'use client'

import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { useState, type ReactNode } from 'react'
import { DeleteAlertDialog } from './delete-alert-dialog'

type Props<T extends { id: number }> = {
  title: string
  description?: string
  items: T[]
  emptyMessage?: string
  renderItem: (item: T) => ReactNode
  renderCreate: (open: boolean, setOpen: (next: boolean) => void) => ReactNode
  renderEdit: (
    item: T | null,
    open: boolean,
    closeEdit: () => void,
  ) => ReactNode
  deleteAction: (formData: FormData) => Promise<void>
  deleteLabel: string
  addLabel?: string
}

export function EntityList<T extends { id: number }>({
  title,
  description,
  items,
  emptyMessage,
  renderItem,
  renderCreate,
  renderEdit,
  deleteAction,
  deleteLabel,
  addLabel = '추가',
}: Props<T>) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const editing = items.find((item) => item.id === editingId) ?? null
  const [lastEditing, setLastEditing] = useState<T | null>(null)
  if (editing && editing !== lastEditing) {
    setLastEditing(editing)
  }

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
        <Box>
          <Heading size="lg">{title}</Heading>
          {description && (
            <Text color="gray.600" mt={1}>
              {description}
            </Text>
          )}
        </Box>
        <Button colorPalette="teal" onClick={() => setCreateOpen(true)}>
          {addLabel}
        </Button>
      </Flex>

      {items.length === 0 ? (
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="lg"
          p={6}
          textAlign="center"
          color="gray.500"
        >
          {emptyMessage ?? '아직 등록된 데이터가 없습니다.'}
        </Box>
      ) : (
        <Stack gap={3}>
          {items.map((item) => (
            <Flex
              key={item.id}
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              p={4}
              gap={3}
              align="center"
              justify="space-between"
              wrap="wrap"
            >
              <Box flex="1" minW={0}>
                {renderItem(item)}
              </Box>
              <Flex gap={2} flexShrink={0}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(item.id)}
                >
                  수정
                </Button>
                <DeleteAlertDialog
                  action={deleteAction}
                  recordId={item.id}
                  label={deleteLabel}
                />
              </Flex>
            </Flex>
          ))}
        </Stack>
      )}

      {renderCreate(createOpen, setCreateOpen)}
      {renderEdit(editing ?? lastEditing, editing !== null, () =>
        setEditingId(null),
      )}
    </Stack>
  )
}
