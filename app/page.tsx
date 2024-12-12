'use client'
import { useState } from 'react'
import { ChevronRight, Globe } from 'lucide-react'
import { Button, Card, CardBody } from '@nextui-org/react'

const menuData = {
  협회소개: {
    items: [
      { title: '인사말', href: '#' },
      { title: '설치근거·연혁', href: '#' },
      { title: '조직도·CI', href: '#' },
      { title: '오시는 길', href: '#' },
    ],
  },
  회원사소개: {
    items: [
      { title: '회원사', href: '#' },
      { title: '회원사 가입안내', href: '#' },
      { title: '회원사 소식', href: '#' },
    ],
  },
  주요사업: {
    items: [
      { title: '국제협력', href: '#' },
      { title: '회원사지원사업', href: '#' },
      { title: '교육연수사업', href: '#' },
    ],
  },
  소식: {
    items: [
      { title: '공지사항', href: '#' },
      { title: '입찰공고', href: '#' },
      { title: '사진·뉴스', href: '#' },
      { title: '지식정보', href: '#' },
    ],
  },
}

export default function Component() {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-[#1a4a8f] text-white relative">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold">STDev</h1>
            <nav className="hidden md:flex space-x-6">
              {Object.keys(menuData).map((menuTitle) => (
                <button
                  key={menuTitle}
                  className={`py-2 px-3 hover:bg-blue-700 transition-colors ${
                    isMegaMenuOpen ? 'bg-blue-700' : ''
                  }`}
                  onMouseEnter={() => setIsMegaMenuOpen(true)}
                >
                  {menuTitle}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <span className="text-white">로그인</span>
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Globe className="h-4 w-4 mr-2" color="white" />
              <span className="text-white">KO | EN</span>
            </Button>
          </div>
        </div>

        {/* 메가 메뉴 드롭다운 */}
        {isMegaMenuOpen && (
          <div
            className="absolute w-full bg-white text-gray-800 shadow-lg z-50"
            onMouseEnter={() => setIsMegaMenuOpen(true)}
            onMouseLeave={() => setIsMegaMenuOpen(false)}
          >
            <div className="container mx-auto px-4 py-6">
              <div className="flex justify-between">
                {Object.entries(menuData).map(([menuTitle, { items }]) => (
                  <div key={menuTitle} className="flex flex-col">
                    <h3 className="font-bold text-blue-600 mb-2 text-lg">
                      {menuTitle}
                    </h3>
                    {items.map((item, index) => (
                      <a
                        key={index}
                        href={item.href}
                        className="hover:text-blue-600 transition-colors py-1"
                      >
                        {item.title}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow">
        <section className="bg-[#f0f0f0] py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4">STDev</h2>
            <p className="text-lg mb-6">
              소프트웨어 개발 분야 학생과 청년들의 활동을 지원합니다.
            </p>
            <Button>
              자세히 보기 <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">주요 소식</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardBody className="p-4">
                    <img
                      src={`/placeholder.svg?height=200&width=300`}
                      alt={`뉴스 이미지 ${i}`}
                      className="w-full h-40 object-cover mb-4"
                    />
                    <h3 className="font-bold mb-2">주요 뉴스 제목 {i}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      2023년 5월 11일
                    </p>
                    <p className="text-sm">
                      주요 뉴스 내용에 대한 간단한 설명이 여기에 들어갑니다.
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between">
            <div className="w-full md:w-1/3 mb-6 md:mb-0">
              <h3 className="text-lg font-bold mb-2">STDev</h3>
              <p className="text-sm">
                주소: 대전광역시 서구 월평로 65, 802호 (월평동, 용원빌딩)
              </p>
              <p className="text-sm">전화: 02-1234-5678</p>
            </div>
            <div className="w-full md:w-1/3 mb-6 md:mb-0">
              <h3 className="text-lg font-bold mb-2">빠른 링크</h3>
              <ul className="text-sm">
                <li>
                  <a href="#" className="hover:underline">
                    개인정보처리방침
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    이용약관
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    사이트맵
                  </a>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/3">
              <h3 className="text-lg font-bold mb-2">뉴스레터 구독</h3>
              <form className="flex">
                <input
                  type="email"
                  placeholder="이메일 주소"
                  className="mr-2 px-3 py-2 border rounded"
                />
                <Button>구독</Button>
              </form>
            </div>
          </div>
          <div className="mt-8 text-center text-sm">
            © 2024 STDev Nonprofit Corporation. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
