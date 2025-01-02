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
  static businessPress = '/home/business/press'
  static businessReview = '/home/business/review'

  static notices = '/home/notices'
  static noticesDonation = '/home/notices/donation'
  static noticesMinutes = '/home/notices/minutes'

  static infoPrivacy = '/info/privacy'
  static infoTerms = '/info/terms'

  static checkout = (productId: string) =>
    `/home/checkout?productId=${productId}`
  static checkoutSuccess = '/home/checkout/success'
  static checkoutFail = '/home/checkout/fail'

  static msit = 'https://www.msit.go.kr'
  static nts = 'https://www.nts.go.kr'
  static acrc = 'https://www.acrc.go.kr'

  static admin = '/admin'
  static adminUser = '/admin/user'
  static adminMarkdown = '/admin/markdown'
  static adminMarkdownCreate = '/admin/markdown/create'
  static adminProduct = '/admin/product'
}
