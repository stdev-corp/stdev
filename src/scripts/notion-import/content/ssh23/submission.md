:::callout{icon="⏰" color="gray_background"}
**기획 / 개발 / 디자인 결과물 제출은 일요일 (1/29) 오후 12시까지 입니다.**\
\
[제출 레포지토리](<https://github.com/SPARCS-Hackathon/2023-Hackathon-Submission>)\
\
\[참고\] 발표 자료 제출은 별도 공지 참고 부탁드립니다
:::

---

::toc

---

## 1. 제출할 Repository 설정 확인

### 1.1 Repository Configurations

제출하고자 하는 모든 GitHub Repository는 **SPARCS-2023-StartUp-Hackathon-#** Organization에 소속되어 있어야 합니다. 최종 제출할 코드가 커밋이 잘 되어 있는지 확인해 주세요.

&nbsp;

또, 심사를 받을 수 있도록 repository의 visibility를 `public` 으로 변경해 주세요. **Private repository는 심사 과정에서 확인이 되지 않습니다.**

&nbsp;

### README.md 

부정행위 방지 및 행사 후 자료 보관, 산출물 홍보를 위해 모든 Repository의 README.md 에는 다음 내용이 포함되어 있어야 합니다.

구체적인 예시가 필요하다면 다음 repository의 README를 참고해 주세요.

::bookmark{url="https://github.com/SPARCS-Hackathon/example-web-monorepo" title="example-web-monorepo"}

::bookmark{url="https://github.com/SPARCS-Hackathon/example-flutter-app" title="example-flutter-app"}

&nbsp;

README는 마크다운을 이용하여 작성할 수 있습니다. 다음 자료를 참고해 주세요.

[Markdown Guide Cheet Sheet](<https://markdownguide.org/cheat-sheet>)

&nbsp;

**README 템플릿**

```markdown
# [TEAM Z] Repository 이름

... Repository에 대한 간략한 설명 ...

다음과 같은 기능이 포함되어 있습니다.
- ... 기능 1 ...
- ... 기능 2 ...


## 프로젝트에서 사용한 기술

... 프로젝트에서 사용한 기술, 오픈소스, code snippet ...


## Dev Server 실행 방법

... 로컬 환경에서 개발 환경을 설정하기 위해 필요한 단계 ...


## Production 배포 방법

... Production에 배포하기 위한 단계들 ...
(배포를 하지 않은 경우 이 섹션은 생략하여도 괜찮습니다)


## 환경 변수 및 시크릿

... 서비스를 실행하기 위한 환경 변수 및 시크릿 ...
(입력되어야 하는 값에 대한 제한이 있는 경우 포함해 주시기 바랍니다)
실제 시크릿 (credential) 값은 절대로 git에 업로드 하면 안됩니다. 
어떤 값이 필요한지 (변수명)만 작성해 주세요.

## 기타

... 기타 설명이 필요한 사항들 ...
```

README에 정해진 형식은 없으나, 위 템플릿에서 주어진 heading들은 유지해 주시기 바랍니다. 

(작성할 항목이 없는 heading은 삭제해 주셔도 됩니다)

&nbsp;

### 1.2 제출 커밋의 Commit Message 및 Commit Hash 확인 

제출한 Repository에서 수정하고 싶은 부분이 있다면 제출 기한 이후 계속해서 작업하여도 괜찮습니다. 다만, **심사 및 배포는 오후 12시 이전의 커밋에 대해서만** 진행될 예정인 만큼, 12시 이전의 최종 제출용 커밋을 기록해 주시기 바랍니다. (기록한 Commit Message 및 Commit Hash는 제출 Issue에서 작성해 주시면 됩니다)

&nbsp;

:color[**주의사항**]{c="red"}

- 모든 Organization의 Repository 멤버 권한은 제출 기한 이후 Write 권한으로 변경될 예정입니다.
- 현재 4가지 Organization에 나뉘어 있는 만큼, 추후 관리를 위해 하나의 Organization으로 Repository가 이전될 수 있습니다.
- 제출 이후 Repository의 삭제는 불가능하며, Ownership 이전 또한 불가능합니다. 만약 개인 계정으로 Repository를 이전하고 싶으시다면, Fork 로 이전해 주시기 바랍니다.

&nbsp;

## 2. GitHub Issue 작성

### 2.1 새로운 Issue 생성 및 제출

:::callout{icon="notion-asset:a0203" color="gray_background"}
[제출용 이슈 생성](<https://github.com/SPARCS-Hackathon/2023-Hackathon-Submission/issues/new?assignees=&labels=submission&template=%EC%B5%9C%EC%A2%85-%EA%B8%B0%ED%9A%8D---%EA%B0%9C%EB%B0%9C---%EB%94%94%EC%9E%90%EC%9D%B8-%EC%A0%9C%EC%B6%9C.md&title=%5BTeam+X%5D+%EC%84%9C%EB%B9%84%EC%8A%A4%EB%AA%85>)
:::

::image{src="notion-asset:a0204" alt="2.1 새로운 Issue 생성 및 제출"}

&nbsp;

제출 Repository (2023-Hackathon-Submission) Issues 으로 이동 후 New Issue 를 클릭하여 새로운 Issue를 생성합니다.

&nbsp;

::image{src="notion-asset:a0205" alt="제출 Repository (2023-Hackathon-Submission) Issues 으로 이동 후 New Issue 를 클릭하여 새로운 Issue를 생성합니다."}

&nbsp;

최종 기획 / 개발 / 디자인 제출 템플릿의 Get Started 버튼을 클릭합니다.

&nbsp;

::image{src="notion-asset:a0206" alt="최종 기획 / 개발 / 디자인 제출 템플릿의 Get Started 버튼을 클릭합니다."}

&nbsp;

필요한 정보를 입력한 다음, 오른쪽 아래 Submit new Issue 를 클릭하여 제출해 주시면 됩니다.

오후 12시 전까지는 작성한 Issue를 수정하여도 괜찮으나, 이후 수정 시 심사 과정에서 불이익이 발생할 수 있습니다.

&nbsp;

Issue 작성 관련하여 예시가 필요한 경우, 다음을 참고해 주시기 바랍니다.

::bookmark{url="https://github.com/SPARCS-Hackathon/2023-Hackathon-Submission/issues/2" title="[Team Z] Example Service (예시 제출)"}

&nbsp;

README에 정해진 형식은 없으나, 템플릿에서 주어진 heading들은 유지해 주시기 바랍니다. 

(작성할 항목이 없는 heading은 삭제해 주셔도 됩니다)

&nbsp;

:color[**주의사항**]{c="red"}

- Issue에 파일을 직접 첨부할 수 있는 방법이 없습니다. 이미지나 문서 업로드 시, **Google Drive** 등 파일 호스팅 서비스에 올린 다음, **링크가 있는 사용자가 볼 수 있음으로** 권한을 변경한 다음 생성된 링크를 첨부해 주시기 바랍니다.
- 발표 자료는 추후 공지에서 제출 방법을 안내해 드릴 예정입니다. Issue에 제출한 발표 자료는 **제출한 것으로 인정하지 않습니다.** 꼭 발표 자료 제출 방법 공지를 참고해 주시기 바랍니다.
- GitHub 링크의 경우, Repository 링크 외에도 Last Commit (제출을 위한 마지막 커밋) 의 커밋 메시지 (링크) + Hash 를 필수적으로 첨부해 주시기 바랍니다.

&nbsp;

### 2.2 제출 마감 이후 GitHub Issue 를 통한 상호 피드백

제출 마감 이후, 자유롭게 다른 팀의 제출물을 확인하고 피드백을 교환할 수 있습니다.

피드백은 각 Issue에 댓글을 남기는 것으로 교환해 주시기 바랍니다.

&nbsp;

피드백은 평가에 반영되지 않으므로 자유롭게 작성해 주시기 바랍니다.
