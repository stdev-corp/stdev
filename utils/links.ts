export class Links {
  static root = '/'

  static home = '/home'
  static my = '/home/my'

  static checkout = (productId: string) =>
    `/home/checkout?productId=${productId}`
  static checkoutSuccess = '/home/checkout/success'
  static checkoutFail = '/home/checkout/fail'

  static msit = 'https://www.msit.go.kr'
  static nts = 'https://www.nts.go.kr'
  static acrc = 'https://www.acrc.go.kr'
}
