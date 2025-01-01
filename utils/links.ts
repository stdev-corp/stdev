export class Links {
  static root = '/'

  static home = '/home'
  static my = '/home/my'

  static checkout = (productId: string) =>
    `/home/checkout?productId=${productId}`
  static checkoutSuccess = '/home/checkout/success'
  static checkoutFail = '/home/checkout/fail'
}
