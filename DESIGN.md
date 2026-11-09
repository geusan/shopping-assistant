---
name: fits
description: 구매 조건을 웹에서 쇼핑몰까지 이어주는 정돈된 딥그린 인터페이스
colors:
  primary: "#164e39"
  canvas: "#fafbf9"
  surface: "#fff"
  ink: "#182c25"
  body-muted: "#606f66"
  summary-surface: "#eaf0e9"
  border: "#dce3dc"
  panel-border: "#cfdacf"
  field-border: "#2c7153"
  selected-surface: "#f0f6ee"
  selected-border: "#29684a"
  focus: "#437c63"
  outline-ink: "#294d3b"
  outline-border: "#cbd7ce"
  selected-chip-surface: "#e7f1e9"
  selected-chip-ink: "#1d6648"
  success-surface: "#eaf3e8"
  success-score: "#1b5739"
  success-segment: "#34704c"
  success-icon-surface: "#eaf3e4"
  success-icon: "#3c784d"
  success-label: "#4c7b4e"
  unknown-surface: "#f9f3e5"
  unknown-score: "#746028"
  unknown-segment: "#8c7c48"
  unknown-icon-surface: "#fcf0d5"
  unknown-icon: "#a17a29"
  unknown-label: "#926c1c"
  unfilled-segment: "#d9dfcb"
typography:
  display: { fontFamily: "Pretendard, sans-serif", fontSize: "52px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-1.6px" }
  headline: { fontFamily: "Pretendard, sans-serif", fontSize: "40px", fontWeight: 700, lineHeight: 1.22, letterSpacing: "-1.2px" }
  dialog-title: { fontFamily: "Pretendard, sans-serif", fontSize: "32px", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.8px" }
  panel-title: { fontFamily: "Pretendard, sans-serif", fontSize: "26px", fontWeight: 700, lineHeight: 1.35, letterSpacing: "-0.7px" }
  title: { fontFamily: "Pretendard, sans-serif", fontSize: "20px", fontWeight: 700, lineHeight: 1.4, letterSpacing: "-0.4px" }
  body: { fontFamily: "Pretendard, sans-serif", fontSize: "17px", fontWeight: 400, lineHeight: 1.65 }
  button: { fontFamily: "Pretendard, sans-serif", fontSize: "16px", fontWeight: 600 }
  label: { fontFamily: "Pretendard, sans-serif", fontSize: "14px", fontWeight: 600 }
  note: { fontFamily: "Pretendard, sans-serif", fontSize: "12px", fontWeight: 400, lineHeight: 1.5 }
  caption: { fontFamily: "Pretendard, sans-serif", fontSize: "11px", fontWeight: 400, lineHeight: 1.5 }
  score: { fontFamily: "Pretendard, sans-serif", fontSize: "72px", fontWeight: 700, lineHeight: 1, letterSpacing: "-3px" }
  score-unknown: { fontFamily: "Pretendard, sans-serif", fontSize: "64px", fontWeight: 700, lineHeight: 1, letterSpacing: "-3px" }
rounded:
  chip: "6px"
  value-field: "7px"
  panel-button: "8px"
  outline-button: "9px"
  button: "10px"
  card: "12px"
  summary: "14px"
  large: "16px"
  circle: "50%"
spacing:
  compact: "6px"
  small: "12px"
  medium: "16px"
  field: "20px"
  panel: "22px"
  section: "24px"
  summary: "28px"
  dialog: "40px"
components:
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.surface}", typography: "{typography.button}", rounded: "{rounded.button}", padding: "0 24px", height: "56px" }
  button-panel: { backgroundColor: "{colors.primary}", textColor: "{colors.surface}", typography: "{typography.label}", rounded: "{rounded.panel-button}", padding: "0 24px", height: "47px", width: "100%" }
  button-outline: { backgroundColor: "transparent", textColor: "{colors.outline-ink}", typography: "{typography.label}", rounded: "{rounded.outline-button}", height: "46px" }
  input-intent: { backgroundColor: "{colors.surface}", textColor: "{colors.ink}", rounded: "{rounded.card}" }
  chip-selected: { backgroundColor: "{colors.selected-chip-surface}", textColor: "{colors.selected-chip-ink}", rounded: "{rounded.chip}", padding: "5px 9px" }
  card-condition: { backgroundColor: "{colors.surface}", textColor: "{colors.ink}", rounded: "{rounded.card}", padding: "20px", height: "106px" }
  navigation-steps: { textColor: "{colors.primary}", height: "104px" }
  score-success: { backgroundColor: "{colors.success-surface}", textColor: "{colors.success-score}", typography: "{typography.score}", padding: "20px 24px" }
  score-unknown: { backgroundColor: "{colors.unknown-surface}", textColor: "{colors.unknown-score}", typography: "{typography.score-unknown}", padding: "17px 24px" }
---

# Design System: fits

## Overview

**Creative North Star: "내 기준은 그대로"**

밝은 중성 바탕, 정돈된 영어 타이포그래피와 딥그린을 사용한다. 넓은 웹 작업 공간과 좁은 확장 프로그램에서 같은 구매 조건을 알아볼 수 있도록, 조건 이름·수치·상태의 위계를 일관되게 유지한다. 브랜드 표현은 로고와 핵심 행동, 선택 표시의 정확한 배치에 집중한다.

이 문서는 [최종 목업 소스](design/build_mockup.py)의 CSS와 로컬 검토 이미지를 기록한다. HTML은 Figma 전달용 정적 소스이며 프런트엔드 스택은 미정이다. 실제 앱, 쇼핑몰 연동, 설치, 결제 또는 반응형 구현을 정의하지 않는다. 상품·가격·사양·점수는 모두 가상 예시다. [로컬 검토](design/review/finish-review.md)의 판정은 `ship`이며, Figma 가져오기 충실도와 프로토타입 동작은 별도 검증 대상이다.

**Key Characteristics:**

- 딥그린 핵심 행동과 옅은 녹색 선택·충족 표시.
- 앰버 정보 부족 상태와 근거를 동반한 적합도.
- 얇은 경계선, 절제된 곡률, 제한된 그림자.
- 구매 조건의 순서와 용어를 유지하는 웹·패널 구성.

## Colors

녹색 기운이 있는 밝은 중성색이 바탕을 만들고, 딥그린과 앰버가 행동 및 상태를 구분한다. 위 frontmatter가 재사용 토큰의 기준이며, 쇼핑몰 예시의 노란 구매 버튼과 브랜드별 색상은 fits 팔레트에 포함하지 않는다.

- **Primary — 딥그린:** `primary`는 로고, 핵심 버튼, 현재 단계에 사용한다. `selected-*`는 선택한 플랫폼과 칩의 약한 면·강한 경계를 구성한다.
- **Semantic — 충족 녹색:** `success-*`는 적합도 배경·숫자·네 개 구간, 근거 행의 체크와 상태 라벨에 사용한다.
- **Semantic — 확인 필요 앰버:** `unknown-*`는 정보 부족 결과에 사용한다. `unfilled-segment`는 미확인 조건에 대응하는 채워지지 않은 구간이다.
- **Neutral — 밝은 작업면:** `canvas` 위에 `surface`를 놓고, `summary-surface`로 구매 의도 요약을 구분한다. 본문은 `ink`, 보조 설명은 `body-muted`를 사용한다. 경계선은 일반·패널·입력·선택 역할을 구분한다.

**The Evidence Rule.** 색만으로 상태를 전달하지 않는다. 충족에는 체크와 ‘충족’, 정보 부족에는 정보 아이콘과 ‘확인 불가’를 함께 표시한다.

## Typography

전체 글꼴은 Pretendard, 대체 글꼴은 sans-serif다. 로컬 소스에는 Regular(400), SemiBold(600), Bold(700)가 포함된다. 제목은 좁은 자간과 뚜렷한 굵기로 질문을 드러내고, 설명과 수치는 간결하게 유지한다.

- **Display / Headline:** 첫 입력 화면의 질문과 일반 웹 화면 제목. 소개 보드 제목은 별도 크기(48px), 줄 높이(1.2), 자간(-1.5px)을 사용한다.
- **Dialog / Panel title:** 설치 안내와 패널 대기 상태. 상태 비교 보드의 패널 제목은 24px이다.
- **Body / Label / Note / Caption:** 웹 안내, 버튼·조건 이름, 근거 값, 출처·상태 설명. 최종 패널 근거 행은 제목 14px, 값 12px, 상태 11px이다.
- **Score:** 성공 결과 72px, 확인 필요 결과 64px. `%`는 35px·400이며 숫자는 `tabular-nums`를 사용한다. 결과 제목은 20px이다.

## Layout

현재 구매 조건 생성은 ChatGPT처럼 간단한 대화형 화면이다. 제품 UI는 모두 영어, 예산 예시는 USD다. 1440×1000 화면의 중앙 760px 대화 열과 하단 입력창을 사용하고, 사용자 메시지는 옅은 녹색 말풍선, fits 답변은 배경 없는 텍스트로 표현한다. 최대 4개 기준을 대화 안의 단순한 목록으로 정리하며 별도의 입력 폼은 사용하지 않는다. 플랫폼 선택은 조건 요약 바로 아래의 Amazon·AliExpress·eBay·Rakuten 버튼으로 이어지고, 확장 프로그램이 연결되면 바로 쇼핑몰을 연다. 미설치 안내도 동일한 채팅 레이아웃에 표시한다. Figma의 최신 대화 화면은 `design/chat-flow.figmacode.js`와 `design/en-copy.json`에 대응한다.

출력은 고정 데스크톱 화면(1440 × 1000px)과 소개 보드(1440 × 480px)다. 웹 내비게이션 높이는 88px, 일반 작업 영역은 좌우 여백 120px 안에 본문 760px·간격 80px·요약 320px로 구성된다. 하단 행동 영역은 112px 높이다. 첫 입력 화면은 608px 텍스트 영역과 488px 이미지 영역을 104px 간격으로 배치한다.

브라우저 화면은 상단 86px 아래에 쇼핑몰 1060px와 확장 패널 380px를 나란히 둔다. 최종 패널 헤더는 58px, 구매 의도 요약은 78px이며 본문 좌우 여백은 22–24px다. 근거 행의 최소 높이는 68px다. 상태 비교 보드의 세 패널은 비교 전시용 416 × 716px이며 실제 사이드 패널 폭의 변경을 뜻하지 않는다.

반응형 분기·모바일 레이아웃·유동 높이는 구현하지 않았다. 고정 화면에서의 여백과 밀도만 검증되었다.

## Elevation & Depth

기본 화면과 조건 행은 그림자 없이 면색과 1px 경계선으로 구분한다. 입력과 선택한 플랫폼은 1.5px 경계선이다. 그림자는 겹치는 구매 기준 미리보기와 설치 모달에만 사용한다.

- **미리보기 카드:** `0 16px 40px #193e2b12`.
- **설치 모달:** `0 24px 80px #0d271e33`; 뒤 화면의 스크림은 `#132b2480`.

## Shapes

조건 카드·입력·플랫폼 행은 12px 곡률을 공유한다. 버튼은 10px, 패널 버튼은 8px, 외곽선 버튼은 9px다. 작은 칩은 6px, 값 입력 표시는 7px, 요약 카드는 14px, 이미지와 모달은 16px를 사용한다. 선택 라디오·단계 번호·상태 아이콘은 원형이다. 아이콘은 둥근 끝과 연결부를 가진 1.7px 선이며, 기본 크기는 22px이고 패널에서는 역할에 따라 축소한다.

## Components

- **Buttons:** 딥그린 채움과 흰 글자의 주 행동. 일반 버튼은 56px, 패널 버튼은 47px, 외곽선 버튼은 46px 높이다. 실제 버튼의 키보드 포커스는 3px `focus` 외곽선과 4px 간격이다. 소스에는 별도 hover 색상·눌림 효과·전환 애니메이션이 없다.
- **Intent field:** 흰 입력면, 녹색 경계, 제품명·사용 목적·예산/배송지의 세 구역. 목업의 정적 표현이며 입력 편집·검증·오류/비활성 상태는 구현되지 않았다.
- **Condition cards / Platform rows:** 일정한 106px 행 높이와 12px 간격. 선택한 플랫폼은 면색·경계·라디오·‘선택됨’ 칩을 함께 바꾼다. 구매 조건은 최대 네 개이며 웹과 패널에서 순서가 같다.
- **Navigation:** 웹은 로고·서비스 설명·언어/통화와 3단계 진행 표시를 분리한다. 완료 단계는 옅은 녹색 체크, 현재 단계는 딥그린 원으로 표시한다. 확장 패널은 연결 상태와 구매 의도를 상단에 유지한다.
- **Score and evidence:** 네 구간과 퍼센트 아래에 조건별 관측 값과 출처를 둔다. 예시 계산은 충족 조건 ÷ 설정 조건이며 4/4는 100%, 3/4는 75%다. 미확인은 충족에 포함하지 않는다. 실제 점수 정책은 미정이다.
- **Unknown / Loading / Empty / Error:** 정보 부족은 근거 설명과 배송 정보 확인 행동을 펼친다. 분석 중·페이지 미감지·접근 불가에는 점수를 표시하지 않으며, 상태 설명과 다음 행동을 제공한다. 로딩 링은 정적 그림이며 애니메이션이 없다. 미충족 전용 시각 상태는 이번 소스에 없다.

사이드카의 컴포넌트는 현재 스타일을 보여주는 독립 HTML/CSS 표본이다. 색상 램프는 패널 미리보기를 위해 합성한 메타데이터이며 구현된 테마 토큰이 아니다.

## Do's and Don'ts

### Do:

- **Do** 구매 조건의 순서·단위·용어를 웹과 확장 패널에서 유지한다.
- **Do** 적합도에 충족 수, 정보 상태, 관측 근거와 계산 설명을 함께 둔다.
- **Do** 기존 곡률과 경계선을 유지하고 그림자는 두 가지 관측된 역할에 사용한다.
- **Do** 목업 데이터와 실제 상품 정보를 명확히 구분한다.

### Don't:

- **Don't** 확인 불가를 충족으로 표시하거나 정보가 없을 때 점수를 만들어낸다.
- **Don't** 쇼핑몰 예시의 노란 버튼이나 브랜드 색상을 fits의 핵심 색상으로 확대한다.
- **Don't** 미구현 hover·입력 검증·모바일·반응형 동작을 완성된 시스템으로 간주한다.
