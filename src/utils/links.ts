export const HOST =
  process.env.NODE_ENV === 'production'
    ? 'https://stdev.kr'
    : 'http://localhost:3000'

export class Links {
  static root = '/'

  static introAbout = '/intro/about'
  static introChart = '/intro/chart'
  static introArticles = '/intro/articles'
  static introDirectors = '/intro/directors'
  static introHistory = '/intro/history'

  static hackathon = '/hackathon'
  static hackathonNews = '/hackathon/news'
  static hackathonBlog = '/hackathon/blog'

  static conference = '/conference'
  static conferenceNews = '/conference/news'
  static conferenceBlog = '/conference/blog'

  static noticesPress = '/notices/press'
  static noticesDonation = '/notices/donation'
  static noticesRecords = '/notices/records'

  static infoPrivacy = '/info/privacy'
  static infoTerms = '/info/terms'
  static infoSitemap = '/info/sitemap'

  static msit = 'https://www.msit.go.kr'
  static nts = 'https://www.nts.go.kr'
  static acrc = 'https://www.acrc.go.kr'

  static admin = '/admin'
}
