import type {
  Business,
  FileAsset,
  History,
  ImageAsset,
  Institution,
  Markdown,
  Report,
  Webpage,
} from '@prisma/client'
import { dateValue } from '@/utils/admin-format'
import { AdminActionButtons } from '@/components/admin/action-buttons'
import { AdminSection } from '@/components/admin/section'
import { formStyle, inputStyle, listStyle } from '@/components/admin/styles'

type ServerAction = (formData: FormData) => Promise<void>

type Props = {
  sessionEmail: string
  businesses: Business[]
  images: ImageAsset[]
  files: FileAsset[]
  institutions: Institution[]
  markdowns: Markdown[]
  webpages: Webpage[]
  reports: Report[]
  histories: History[]
  actions: {
    createBusiness: ServerAction
    createFileAsset: ServerAction
    createHistory: ServerAction
    createImageAsset: ServerAction
    createInstitution: ServerAction
    createMarkdown: ServerAction
    createReport: ServerAction
    createWebpage: ServerAction
    deleteBusiness: ServerAction
    deleteFileAsset: ServerAction
    deleteHistory: ServerAction
    deleteImageAsset: ServerAction
    deleteInstitution: ServerAction
    deleteMarkdown: ServerAction
    deleteReport: ServerAction
    deleteWebpage: ServerAction
    updateBusiness: ServerAction
    updateFileAsset: ServerAction
    updateHistory: ServerAction
    updateImageAsset: ServerAction
    updateInstitution: ServerAction
    updateMarkdown: ServerAction
    updateReport: ServerAction
    updateWebpage: ServerAction
  }
}

export function AdminDashboard({
  sessionEmail,
  businesses,
  images,
  files,
  institutions,
  markdowns,
  webpages,
  reports,
  histories,
  actions,
}: Props) {
  return (
    <main
      style={{ margin: '40px auto', maxWidth: 960, fontFamily: 'sans-serif' }}
    >
      <h1>STDev DIY CMS</h1>
      <p>{sessionEmail} 계정으로 로그인했습니다.</p>

      <AdminSection title="현재 데이터">
        <ul>
          <li>사업: {businesses.length}</li>
          <li>이미지: {images.length}</li>
          <li>파일: {files.length}</li>
          <li>기관: {institutions.length}</li>
          <li>마크다운: {markdowns.length}</li>
          <li>웹페이지: {webpages.length}</li>
          <li>보고서: {reports.length}</li>
          <li>연혁: {histories.length}</li>
        </ul>
      </AdminSection>

      <AdminSection title="기존 데이터 관리">
        <div style={listStyle}>
          <h3>사업</h3>
          {businesses.map((business) => (
            <form
              key={business.id}
              action={actions.updateBusiness}
              style={formStyle}
            >
              <input type="hidden" name="id" value={business.id} />
              <strong>#{business.id}</strong>
              <input
                name="name"
                defaultValue={business.name}
                required
                style={inputStyle}
              />
              <input
                name="code"
                defaultValue={business.code}
                required
                style={inputStyle}
              />
              <input
                name="startDate"
                type="date"
                defaultValue={dateValue(business.startDate)}
                required
                style={inputStyle}
              />
              <input
                name="endDate"
                type="date"
                defaultValue={dateValue(business.endDate)}
                required
                style={inputStyle}
              />
              <input
                name="location"
                defaultValue={business.location ?? ''}
                style={inputStyle}
              />
              <AdminActionButtons deleteAction={actions.deleteBusiness} />
            </form>
          ))}
          <h3>이미지</h3>
          {images.map((image) => (
            <form
              key={image.id}
              action={actions.updateImageAsset}
              style={formStyle}
            >
              <input type="hidden" name="id" value={image.id} />
              <strong>#{image.id}</strong>
              <input
                name="url"
                defaultValue={image.url ?? ''}
                style={inputStyle}
              />
              <input
                name="file"
                type="file"
                accept="image/*"
                style={inputStyle}
              />
              <input
                name="filename"
                defaultValue={image.filename ?? ''}
                style={inputStyle}
              />
              <input
                name="alt"
                defaultValue={image.alt ?? ''}
                style={inputStyle}
              />
              <input
                name="mimeType"
                defaultValue={image.mimeType ?? ''}
                style={inputStyle}
              />
              <AdminActionButtons deleteAction={actions.deleteImageAsset} />
            </form>
          ))}
          <h3>파일</h3>
          {files.map((file) => (
            <form
              key={file.id}
              action={actions.updateFileAsset}
              style={formStyle}
            >
              <input type="hidden" name="id" value={file.id} />
              <strong>#{file.id}</strong>
              <input
                name="url"
                defaultValue={file.url ?? ''}
                style={inputStyle}
              />
              <input
                name="file"
                type="file"
                accept="application/pdf"
                style={inputStyle}
              />
              <input
                name="filename"
                defaultValue={file.filename}
                required
                style={inputStyle}
              />
              <input
                name="mimeType"
                defaultValue={file.mimeType ?? ''}
                style={inputStyle}
              />
              <AdminActionButtons deleteAction={actions.deleteFileAsset} />
            </form>
          ))}
          <h3>기관</h3>
          {institutions.map((institution) => (
            <form
              key={institution.id}
              action={actions.updateInstitution}
              style={formStyle}
            >
              <input type="hidden" name="id" value={institution.id} />
              <strong>#{institution.id}</strong>
              <input
                name="nameKo"
                defaultValue={institution.nameKo}
                required
                style={inputStyle}
              />
              <input
                name="nameEn"
                defaultValue={institution.nameEn}
                required
                style={inputStyle}
              />
              <input
                name="url"
                defaultValue={institution.url}
                required
                style={inputStyle}
              />
              <select
                name="logoId"
                defaultValue={institution.logoId}
                required
                style={inputStyle}
              >
                {images.map((image) => (
                  <option key={image.id} value={image.id}>
                    #{image.id} {image.filename ?? image.url}
                  </option>
                ))}
              </select>
              <AdminActionButtons deleteAction={actions.deleteInstitution} />
            </form>
          ))}
          <h3>마크다운</h3>
          {markdowns.map((markdown) => (
            <form
              key={markdown.id}
              action={actions.updateMarkdown}
              style={formStyle}
            >
              <input type="hidden" name="id" value={markdown.id} />
              <strong>#{markdown.id}</strong>
              <select
                name="type"
                defaultValue={markdown.type}
                required
                style={inputStyle}
              >
                <option value="articles">정관</option>
                <option value="privacy">개인정보처리방침</option>
                <option value="terms">이용약관</option>
              </select>
              <input
                name="revisionDate"
                type="date"
                defaultValue={dateValue(markdown.revisionDate)}
                required
                style={inputStyle}
              />
              <input
                name="effectiveDate"
                type="date"
                defaultValue={dateValue(markdown.effectiveDate)}
                required
                style={inputStyle}
              />
              <textarea
                name="content"
                defaultValue={markdown.content}
                required
                rows={8}
                style={inputStyle}
              />
              <AdminActionButtons deleteAction={actions.deleteMarkdown} />
            </form>
          ))}
          <h3>웹페이지</h3>
          {webpages.map((webpage) => (
            <form
              key={webpage.id}
              action={actions.updateWebpage}
              style={formStyle}
            >
              <input type="hidden" name="id" value={webpage.id} />
              <strong>#{webpage.id}</strong>
              <select
                name="type"
                defaultValue={webpage.type}
                required
                style={inputStyle}
              >
                <option value="blog_post">블로그 포스트</option>
                <option value="news_article">신문 기사</option>
                <option value="press_release">보도 자료</option>
              </select>
              <input
                name="url"
                defaultValue={webpage.url}
                required
                style={inputStyle}
              />
              <input
                name="title"
                defaultValue={webpage.title}
                required
                style={inputStyle}
              />
              <input
                name="author"
                defaultValue={webpage.author}
                required
                style={inputStyle}
              />
              <input
                name="publishedDate"
                type="date"
                defaultValue={dateValue(webpage.publishedDate)}
                required
                style={inputStyle}
              />
              <select
                name="businessId"
                defaultValue={webpage.businessId ?? ''}
                style={inputStyle}
              >
                <option value="">관련 사업 없음</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <AdminActionButtons deleteAction={actions.deleteWebpage} />
            </form>
          ))}
          <h3>보고서</h3>
          {reports.map((report) => (
            <form
              key={report.id}
              action={actions.updateReport}
              style={formStyle}
            >
              <input type="hidden" name="id" value={report.id} />
              <strong>#{report.id}</strong>
              <input
                name="title"
                defaultValue={report.title}
                required
                style={inputStyle}
              />
              <input
                name="publishedDate"
                type="date"
                defaultValue={dateValue(report.publishedDate)}
                required
                style={inputStyle}
              />
              <select
                name="type"
                defaultValue={report.type}
                required
                style={inputStyle}
              >
                <option value="meeting">총회 및 이사회</option>
                <option value="donation">기부금 모금액 및 활용실적</option>
              </select>
              <select
                name="fileId"
                defaultValue={report.fileId}
                required
                style={inputStyle}
              >
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    #{file.id} {file.filename}
                  </option>
                ))}
              </select>
              <AdminActionButtons deleteAction={actions.deleteReport} />
            </form>
          ))}
          <h3>연혁</h3>
          {histories.map((history) => (
            <form
              key={history.id}
              action={actions.updateHistory}
              style={formStyle}
            >
              <input type="hidden" name="id" value={history.id} />
              <strong>#{history.id}</strong>
              <input
                name="date"
                type="date"
                defaultValue={dateValue(history.date)}
                required
                style={inputStyle}
              />
              <input
                name="title"
                defaultValue={history.title}
                required
                style={inputStyle}
              />
              <textarea
                name="content"
                defaultValue={history.content ?? ''}
                rows={4}
                style={inputStyle}
              />
              <select
                name="imageId"
                defaultValue={history.imageId ?? ''}
                style={inputStyle}
              >
                <option value="">이미지 없음</option>
                {images.map((image) => (
                  <option key={image.id} value={image.id}>
                    #{image.id} {image.filename ?? image.url}
                  </option>
                ))}
              </select>
              <AdminActionButtons deleteAction={actions.deleteHistory} />
            </form>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="사업 추가">
        <form action={actions.createBusiness} style={formStyle}>
          <input name="name" placeholder="이름" required style={inputStyle} />
          <input name="code" placeholder="코드" required style={inputStyle} />
          <input name="startDate" type="date" required style={inputStyle} />
          <input name="endDate" type="date" required style={inputStyle} />
          <input name="location" placeholder="장소" style={inputStyle} />
          <button type="submit">저장</button>
        </form>
      </AdminSection>

      <AdminSection title="이미지 추가">
        <form action={actions.createImageAsset} style={formStyle}>
          <input
            name="url"
            placeholder="기존 S3 이미지 URL (선택)"
            style={inputStyle}
          />
          <input name="file" type="file" accept="image/*" style={inputStyle} />
          <input name="filename" placeholder="파일명" style={inputStyle} />
          <input name="alt" placeholder="대체 텍스트" style={inputStyle} />
          <input name="mimeType" placeholder="MIME 타입" style={inputStyle} />
          <button type="submit">저장</button>
        </form>
      </AdminSection>

      <AdminSection title="PDF 파일 추가">
        <form action={actions.createFileAsset} style={formStyle}>
          <input
            name="url"
            placeholder="기존 S3 PDF URL (선택)"
            style={inputStyle}
          />
          <input
            name="file"
            type="file"
            accept="application/pdf"
            style={inputStyle}
          />
          <input name="filename" placeholder="파일명" style={inputStyle} />
          <input name="mimeType" placeholder="MIME 타입" style={inputStyle} />
          <button type="submit">저장</button>
        </form>
      </AdminSection>

      <AdminSection title="기관 추가">
        <form action={actions.createInstitution} style={formStyle}>
          <input
            name="nameKo"
            placeholder="기관명(한국어)"
            required
            style={inputStyle}
          />
          <input
            name="nameEn"
            placeholder="기관명(영어)"
            required
            style={inputStyle}
          />
          <input
            name="url"
            placeholder="홈페이지 URL"
            required
            style={inputStyle}
          />
          <select name="logoId" required style={inputStyle}>
            <option value="">로고 이미지 선택</option>
            {images.map((image) => (
              <option key={image.id} value={image.id}>
                #{image.id} {image.filename ?? image.url}
              </option>
            ))}
          </select>
          <button type="submit">저장</button>
        </form>
      </AdminSection>

      <AdminSection title="마크다운 추가">
        <form action={actions.createMarkdown} style={formStyle}>
          <select name="type" required style={inputStyle}>
            <option value="articles">정관</option>
            <option value="privacy">개인정보처리방침</option>
            <option value="terms">이용약관</option>
          </select>
          <input name="revisionDate" type="date" required style={inputStyle} />
          <input name="effectiveDate" type="date" required style={inputStyle} />
          <textarea
            name="content"
            placeholder="내용"
            required
            rows={10}
            style={inputStyle}
          />
          <button type="submit">저장</button>
        </form>
      </AdminSection>

      <AdminSection title="웹페이지 추가">
        <form action={actions.createWebpage} style={formStyle}>
          <select name="type" required style={inputStyle}>
            <option value="blog_post">블로그 포스트</option>
            <option value="news_article">신문 기사</option>
            <option value="press_release">보도 자료</option>
          </select>
          <input name="url" placeholder="URL" required style={inputStyle} />
          <input name="title" placeholder="제목" required style={inputStyle} />
          <input
            name="author"
            placeholder="작성자"
            required
            style={inputStyle}
          />
          <input name="publishedDate" type="date" required style={inputStyle} />
          <select name="businessId" style={inputStyle}>
            <option value="">관련 사업 없음</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
          <button type="submit">저장</button>
        </form>
      </AdminSection>

      <AdminSection title="보고서 추가">
        <form action={actions.createReport} style={formStyle}>
          <select name="type" required style={inputStyle}>
            <option value="meeting">총회 및 이사회</option>
            <option value="donation">기부금 모금액 및 활용실적</option>
          </select>
          <input name="title" placeholder="제목" required style={inputStyle} />
          <input name="publishedDate" type="date" required style={inputStyle} />
          <select name="fileId" required style={inputStyle}>
            <option value="">PDF 선택</option>
            {files.map((file) => (
              <option key={file.id} value={file.id}>
                #{file.id} {file.filename}
              </option>
            ))}
          </select>
          <button type="submit">저장</button>
        </form>
      </AdminSection>

      <AdminSection title="연혁 추가">
        <form action={actions.createHistory} style={formStyle}>
          <input name="date" type="date" required style={inputStyle} />
          <input name="title" placeholder="제목" required style={inputStyle} />
          <textarea
            name="content"
            placeholder="내용"
            rows={5}
            style={inputStyle}
          />
          <select name="imageId" style={inputStyle}>
            <option value="">이미지 없음</option>
            {images.map((image) => (
              <option key={image.id} value={image.id}>
                #{image.id} {image.filename ?? image.url}
              </option>
            ))}
          </select>
          <button type="submit">저장</button>
        </form>
      </AdminSection>
    </main>
  )
}
