'use client'
import { Links } from '@/utils/links'
import {
  loadTossPayments,
  TossPaymentsWidgets,
} from '@tosspayments/tosspayments-sdk'
import { useEffect, useState } from 'react'

const clientKey = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'
const customerKey = 'YYe0QwDuSsgqizlVuxxNA'

export default function CheckoutPage() {
  const [amount, setAmount] = useState({
    currency: 'KRW',
    value: 50_000,
  })
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
        {/* 쿠폰 체크박스 */}
        <div>
          <div>
            <label htmlFor="coupon-box">
              <input
                id="coupon-box"
                type="checkbox"
                aria-checked="true"
                disabled={!ready}
                onChange={(event) => {
                  // ------  주문서의 결제 금액이 변경되었을 경우 결제 금액 업데이트 ------
                  setAmount(
                    event.target.checked
                      ? { value: 30_000, currency: 'KRW' }
                      : { value: 50_000, currency: 'KRW' },
                  )
                }}
              />
              <span>협력 단체 회원입니다. (₩20,000원 할인)</span>
            </label>
          </div>
        </div>

        {/* 결제하기 버튼 */}
        <button
          className="button"
          disabled={!ready}
          onClick={async () => {
            try {
              // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
              // 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
              // 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
              await widgets?.requestPayment({
                orderId: 'sLCujz-_uibdgWxBdYr5W',
                orderName: '토스 티셔츠 외 2건',
                successUrl: Links.checkoutSuccess,
                failUrl: Links.checkoutFail,
                customerEmail: 'customer123@gmail.com',
                customerName: '김토스',
                customerMobilePhone: '01012341234',
              })
            } catch (error) {
              // 에러 처리하기
              console.error(error)
            }
          }}
        >
          결제하기
        </button>
      </div>
    </div>
  )
}
