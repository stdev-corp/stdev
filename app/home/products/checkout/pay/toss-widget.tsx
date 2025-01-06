'use client'
import { HOST, Links } from '@/utils/links'
import { Button } from '@nextui-org/react'
import { Order, Product } from '@prisma/client'
import {
  loadTossPayments,
  TossPaymentsWidgets,
} from '@tosspayments/tosspayments-sdk'
import { useEffect, useMemo, useState } from 'react'

const clientKey = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'
const customerKey = 'YYe0QwDuSsgqizlVuxxNA'

type TossWidgetProps = {
  product: Pick<Product, 'name' | 'price'>
  order: Pick<Order, 'id' | 'name' | 'email' | 'phone'>
}

export default function TossWidget(props: TossWidgetProps) {
  const amount = useMemo(
    () => ({
      currency: 'KRW',
      value: props.product.price,
    }),
    [props.product.price],
  )

  const [ready, setReady] = useState(false)
  const [widgets, setWidgets] = useState<TossPaymentsWidgets>()

  useEffect(() => {
    async function fetchPaymentWidgets() {
      const tossPayments = await loadTossPayments(clientKey)
      const widgets = tossPayments.widgets({
        customerKey,
      })

      setWidgets(widgets)
    }

    fetchPaymentWidgets()
  }, [])

  useEffect(() => {
    async function renderPaymentWidgets() {
      if (widgets == null) {
        return
      }

      await widgets.setAmount(amount)

      await Promise.all([
        // ------  결제 UI 렌더링 ------
        widgets.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        }),
        // ------  이용약관 UI 렌더링 ------
        widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        }),
      ])

      setReady(true)
    }

    renderPaymentWidgets()
  }, [amount, widgets])

  useEffect(() => {
    if (widgets == null) {
      return
    }

    widgets.setAmount(amount)
  }, [widgets, amount])

  return (
    <div className="wrapper">
      <div className="box_section">
        {/* 결제 UI */}
        <div id="payment-method" />
        {/* 이용약관 UI */}
        <div id="agreement" />
        {/* 결제하기 버튼 */}
        <Button
          className="button text-white ml-8"
          color="primary"
          size="lg"
          disabled={!ready}
          onPress={async () => {
            try {
              // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
              // 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
              // 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
              await widgets?.requestPayment({
                orderId: props.order.id,
                orderName: props.product.name,
                successUrl: HOST + Links.checkoutSuccess,
                failUrl: HOST + Links.checkoutFail,
                customerEmail: props.order.email,
                customerName: props.order.name,
                customerMobilePhone: props.order.phone,
              })
            } catch (error) {
              // 에러 처리하기
              console.error(error)
            }
          }}
        >
          결제하기
        </Button>
      </div>
    </div>
  )
}
