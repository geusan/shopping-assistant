# Figma 쇼핑 여정 목업

Mode: Operate. Artifact: design/fits-mockup.html → editable Figma frames.

## Direction contract

THESIS: 원하는 물건보다 원하는 조건이 쇼핑의 중심이다. 조건 네 개를 웹에서 확장 프로그램까지 같은 순서와 용어로 이어준다.

OWN-WORLD: 사용자가 승인한 fits, 딥그린. 밝은 중성 바탕, 정돈된 Pretendard 타이포그래피, 12px 곡률, 선택과 성공에만 사용하는 녹색, 정보 부재는 앰버. 상품 사진은 사용자의 구매 의도를 설명한다.

STORY: 대화 시작 → 용도·예산 질문 → 대화 안에서 조건 정리 → 채팅 안의 플랫폼 버튼 → 연결 상태에 따른 직접 이동 또는 채팅 설치 안내 → 탐색 대기 → 상세 분석 → 근거를 확인하고 구매.

FIRST VIEWPORT: 흰 배경과 760px 폭의 중앙 대화 영역. 첫 화면은 질문과 입력창, 이후 화면은 사용자 말풍선과 fits의 답변, 하단 입력창을 유지한다. 별도 폼 대신 대화 안에서 최대 4개 조건을 정리하고 수정도 메시지로 요청한다. 모든 제품 UI 문구는 영어, 예산 예시는 $150다.

FORM: 사용자 지정 방향. seed: none (user-pinned). 플랫폼은 조건 요약 아래 버튼으로 직접 선택한다. 별도 선택 페이지 없이 쇼핑몰로 이동하며, 미설치 안내도 같은 대화 안에서 제공한다. 분석 결과는 쇼핑몰을 떠나지 않는 사이드 패널이다.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Mock data and score

가상 상품 AURA H1. 조건: 노이즈 캔슬링, 무게 250g 이하, 배터리 30시간 이상, 총액 $150 이하. 목업 점수는 충족한 조건 수 / 설정한 조건 수. 확인 불가는 충족으로 간주하지 않는다. 성공 4/4=100%, 확인 필요 3/4=75%. 실제 서비스 점수 정책은 미확정.

## Required screens

대화 시작, 용도·예산 대화, 조건 정리와 플랫폼 버튼, 채팅 설치 안내, 플랫폼 검색+활성화, 상품 분석 성공, 상품 분석 확인 필요, 확장 프로그램 로딩·페이지 미감지·접근 오류.
