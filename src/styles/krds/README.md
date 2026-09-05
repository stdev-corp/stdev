# KRDS 벤더링 자산

공개 사이트 `(stdev)`가 사용하는 **KRDS(Korea Design System, 대한민국 정부 디지털 서비스 UI/UX 디자인시스템)** HTML 컴포넌트 킷이다.

- 출처: <https://github.com/KRDS-uiux/krds-uiux> (행정안전부 / 한국지능정보사회진흥원)
- 문서: <https://www.krds.go.kr>
- 라이선스: 공공누리 제1유형 — 상업적 이용과 변형이 모두 허용되며 **출처 표기가 의무**다.
  출처 표기는 `src/components/krds/footer.tsx`의 `.f-attribution` 문단에 있다. 지우지 말 것.

## 파일

| 파일                             | 출처                                         | 수정 여부                                                                         |
| -------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/styles/krds/krds.min.css`   | `resources/cdn/krds.min.css`                 | 아이콘 `url()`을 `https://www.krds.go.kr/resources/img/` → `/krds/img/` 로만 치환 |
| `public/krds/img/**`             | `resources/img/**`                           | 원본 그대로                                                                       |
| `public/krds/fonts/**`           | `resources/fonts/**` (Pretendard GOV subset) | 원본 그대로                                                                       |
| `src/styles/krds/krds-fonts.css` | 직접 작성                                    | 킷에 `@font-face` 선언이 없어 이 저장소에서 추가                                  |
| `src/styles/krds/stdev-krds.css` | 직접 작성                                    | 킷이 제공하지 않는 페이지 레이아웃과 STDev 고유 요소                              |

CSS는 `src/app/(stdev)/layout.tsx`가 위 순서대로 `import` 한다. Next.js 번들러가
해시·압축·순서를 관리하며, `(cms)` 관리자 화면에는 주입되지 않는다. 이미지와 글꼴은
CSS 안에서 `/krds/...` 절대 경로로 참조하므로 `public/` 에 그대로 두어야 한다.

## 갱신 방법

```bash
git clone --depth 1 https://github.com/KRDS-uiux/krds-uiux.git /tmp/krds
rm -rf public/krds/img public/krds/fonts
cp -R /tmp/krds/resources/img public/krds/img
cp -R /tmp/krds/resources/fonts public/krds/fonts
sed 's|https://www\.krds\.go\.kr/resources/img/|/krds/img/|g' \
  /tmp/krds/resources/cdn/krds.min.css > src/styles/krds/krds.min.css
```

`krds-fonts.css`와 `stdev-krds.css`는 이 저장소 소유이므로 덮어쓰지 않는다.

## 규칙

- `krds.min.css`, `public/krds/img/**`, `public/krds/fonts/**`는 직접 수정하지 않는다. 사이트 고유 스타일은 `stdev-krds.css`에 쓴다.
- `stdev-krds.css`의 치수는 대응하는 KRDS 디자인 토큰(`var(--krds-*)`)이 있으면 반드시 그것을 쓴다.
  간격·크기는 `--krds-number-*`(0 ~ 9.6rem)와 `--krds-size-height-*`, 테두리는
  `--krds-light-border-width-static-*`, 색은 `--krds-light-color-*`에 대응한다.
  토큰 1,818개가 `krds.min.css`에 모두 들어 있다.
- 토큰 스케일이 덮지 못하는 값(9.6rem을 넘는 컴포넌트 치수, `vh`·`em` 단위)만
  직접 적되 이유를 주석으로 남긴다. 자세한 정책은 저장소 루트 `AGENTS.md`의
  **Styling (public)** 항목을 따른다.
- 정부 아이덴티티 컴포넌트(`#krds-masthead`, `.krds-identifier`, 정부상징)는 사용하지 않는다.
  STDev는 민간 사단법인이므로 정부기관으로 오인될 수 있다.
