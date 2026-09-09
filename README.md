# KRC APP

FTC(First Tech Challenge) 스타일 대회 참가자용 대진표 웹앱입니다. Next.js App Router, TypeScript, Tailwind CSS, Auth.js, Prisma(SQLite), Web Push를 사용합니다.

모바일(~390px) 우선이며, 한국어 UI는 참고 화면의 공지 / 대진표 / 체크인 흐름을 따릅니다.

## 기능

- **공지 / 대진표** 하단 탭
- **우리팀 대진표 / 전체 대진표** 필터
- 경기 카드: 2v2 레드/블루 얼라이언스, 점수 또는 `vs`, 예정·진행중·종료 배지, 체크인 X/O
- 팀 탭 모달: 체크인 토글, **알림호출** (Web Push)
- 로그인(팀 번호 + 이메일), 프로필, 로그아웃
- `/admin` 경기 진행 현황 그리드 (10초 자동 새로고침)
- 라이브 시계(1초), 대진표 폴링(10초)

## 필요 환경

- Node.js 20+
- npm

## 설치

```bash
git clone <repo>
cd krcapp
npm install
cp .env.example .env
```

`.env`를 채운 뒤 데이터베이스를 만들고 시드합니다.

```bash
# AUTH_SECRET
openssl rand -base64 32

# VAPID (Web Push) 키
npm run vapid
# 또는: npx web-push generate-vapid-keys
```

`.env` 예시:

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="긴-랜덤-문자열"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@krc.app"
```

```bash
npm run db:setup
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

스키마만 반영하려면 `npm run db:push`, 시드만 다시 넣으려면 `npm run db:seed` 입니다.

## 데모 계정

로그인 화면 placeholder는 참고 앱과 같습니다. **Team number** / **email**.

| Username | Password (email) | 팀 |
| --- | --- | --- |
| `28657` | `28657@krc.app` | 우리팀 대진표 데모 |
| `33863` | `33863@krc.app` | 진행중 경기 체크인 데모 |
| `admin` | `admin@krc.app` | 운영 계정 (팀 없음) |

잘못된 비밀번호는 빨간 배너 `Sign in failed. Check the details you provided are correct.` 와 빨간 입력 테두리를 보여 줍니다.

시드 데이터: 이벤트 **울산프리미어리그 테스트**, 16경기(종료·진행중·예정 혼합). 공지는 비어 있어 `아직 공지가 없습니다`가 표시됩니다.

## Web Push (무료, VAPID)

유료 푸시 서비스 없이 **Web Push + VAPID** 만 사용합니다.

1. `npm run vapid` 로 키 생성 후 `.env`에 넣습니다.
2. 팀 계정으로 로그인한 뒤 **프로필 → 알림 허용**.
3. 대진표에서 해당 팀을 눌러 **알림호출**.

구독 기기가 없으면 API가 `구독된 기기가 없습니다...`를 반환하고 서버 로그에 `[push] No subscriptions for team ...` 가 남습니다.

### HTTPS / localhost

브라우저 Push API는 **HTTPS** 또는 **localhost** 에서만 동작합니다.

- 로컬: `http://localhost:3000` 은 허용됩니다. `http://127.0.0.1:3000` 이나 LAN IP는 브라우저에 따라 차단됩니다.
- 배포: HTTPS가 필요합니다. `AUTH_URL`을 공개 URL로 맞추세요.
- iOS Safari는 홈 화면 추가(PWA) 후에만 웹 푸시가 되는 경우가 많습니다.
- 알림을 지원하지 않는 브라우저는 프로필에 경고를 표시합니다.

`public/sw.js` 서비스 워커와 `public/manifest.json` 으로 설치 가능한 PWA로 동작합니다.

## 주요 경로

| 경로 | 설명 |
| --- | --- |
| `/` | 대진표 |
| `/notices` | 공지 |
| `/login` | 로그인 |
| `/profile` | 프로필 · 로그아웃 · 알림 |
| `/admin` | 경기 진행 현황 그리드 |

## 스택

- Next.js App Router + TypeScript + Tailwind CSS
- Auth.js (next-auth v5) Credentials
- Prisma + SQLite
- `web-push` + VAPID

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run db:setup` | `prisma db push` + seed |
| `npm run vapid` | VAPID 키 출력 |

## 프로덕션 참고

SQLite 파일은 `prisma/dev.db`에 생성됩니다. 서버리스 배포보다는 디스크가 있는 호스트(VPS, Docker 볼륨 등)에 맞습니다. `AUTH_SECRET`과 VAPID 개인키는 저장소에 커밋하지 마세요.
