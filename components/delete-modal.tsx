'use client'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/modal'
import { Button } from '@heroui/button'
import { ReactNode } from 'react'
import { Links } from '@/utils/links'
import Link from 'next/link'
import { Model } from '@/utils/prisma'

type Props = {
  children: ReactNode
  id: string
  model: Model
  redirectPath: string
}

export default function DeleteModal(props: Props) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const searchParams = new URLSearchParams()
  searchParams.append('id', props.id)
  searchParams.append('model', props.model)
  searchParams.append('redirectPath', props.redirectPath)
  const url = `${Links.apiDelete}?${searchParams.toString()}`

  return (
    <>
      <Button onPress={onOpen} size="sm" color="danger">
        삭제
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                정말로 삭제하시겠습니까?
              </ModalHeader>
              <ModalBody>{props.children}</ModalBody>
              <ModalFooter>
                <Button variant="bordered" onPress={onClose}>
                  취소
                </Button>
                <Button color="primary" onPress={onClose} as={Link} href={url}>
                  확인
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
