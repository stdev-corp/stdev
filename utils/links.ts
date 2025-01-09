export const HOST =
  process.env.NODE_ENV === 'production'
    ? 'https://stdev.kr'
    : 'https://localhost:3000'

export class Links {
  static root = '/'

  static home = '/home'
  static my = '/home/my'

  static intro = '/home/intro'
  static introChart = '/home/intro/chart'
  static introArticles = '/home/intro/articles'
  static introDirectors = '/home/intro/directors'
  static introHistory = '/home/intro/history'

  static business = '/home/business'
  static businessHackathon = '/home/business/hackathon'
  static businessConference = '/home/business/conference'
  static businessBlog = '/home/business/blog'
  static businessNews = '/home/business/news'

  static notices = '/home/notices'
  static noticesPress = '/home/notices/press'
  static noticesDonation = '/home/notices/donation'
  static noticesRecords = '/home/notices/records'

  static infoPrivacy = '/info/privacy'
  static infoTerms = '/info/terms'

  static products = '/home/products'
  static checkoutUserInfo = (productId: string) =>
    `/home/products/checkout/user-info?productId=${productId}`
  static checkoutPay = (orderId: string) =>
    `/home/products/checkout/pay?orderId=${orderId}`
  static checkoutSuccess = `/home/products/checkout/success`
  static checkoutFail = `/home/products/checkout/fail`
  static checkoutFailWithParams = (code: string, message: string) =>
    `/home/products/checkout/fail?code=${code}&message=${message}`

  static productsMyOrder = '/home/products/my-order'

  static msit = 'https://www.msit.go.kr'
  static nts = 'https://www.nts.go.kr'
  static acrc = 'https://www.acrc.go.kr'

  static admin = '/admin'
  static adminUser = '/admin/user'
  static adminMarkdown = '/admin/markdown'
  static adminMarkdownCreate = '/admin/markdown/create-edit'
  static adminMarkdownEdit = (id: string) =>
    `/admin/markdown/create-edit?id=${id}`
  static adminProduct = '/admin/product'
  static adminProductCreate = '/admin/product/create'
  static adminRedirect = '/admin/redirect'
  static adminRedirectCreate = '/admin/redirect/create'
  static adminRecord = '/admin/record'
  static adminRecordCreate = '/admin/record/create'
  static adminInstitution = '/admin/institution'
  static adminInstitutionCreate = '/admin/institution/create'
  static adminEvent = '/admin/event'
  static adminEventCreate = '/admin/event/create'
  static adminWebpage = '/admin/webpage'
  static adminWebpageCreate = '/admin/webpage/create'

  static apiDelete = '/api/delete'

  static googleMail = 'http://mail.stdev.kr'
  static googleDrive = 'http://drive.stdev.kr'
  static googleCalendar = 'http://calendar.stdev.kr'
}
