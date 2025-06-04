// server.js – Developer Tools Hub
const express = require('express');
const path = require('path');
const Diff = require('diff');
const app = express();
const port = process.env.PORT || 3000;


// ◼︎ Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ◼︎ Static assets
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ◼︎ Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ◼︎ Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ────────────────────────────────────────────────────────────
// 📄 Main page
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  } catch (error) {
    console.error('메인 페이지 로드 오류:', error);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
});

// ────────────────────────────────────────────────────────────
// 🛠️  Tool page routing
const tools = [
  // 기존 12개
  { name: 'compare',        title: '코드/텍스트 비교 도구' },
  { name: 'json',           title: 'JSON 포매터 & 검증' },
  { name: 'markdown',       title: 'Markdown 미리보기' },
  { name: 'base64',         title: 'Base64 인코딩/디코딩' },
  { name: 'image-resize',   title: '이미지 압축 & 크기 조정' },
  { name: 'password',       title: '랜덤 패스워드 생성' },
  { name: 'shorturl',       title: 'URL 단축기' },
  { name: 'regex',          title: 'Regex 테스터' },
  { name: 'ipinfo',         title: 'IP 주소 정보 확인' },
  { name: 'notepad',        title: '온라인 메모장' },
  { name: 'fileconvert',    title: '파일 타입 변환기' },
  { name: 'qrcode',         title: 'QR 코드 생성기' },

  // ───────────────────────────────────────────────────
  // 🆕 8개 추가 (2025‑06‑04)
  { name: 'api-tester',     title: 'REST API 퀵 테스터' },
  { name: 'og-preview',     title: 'Open Graph & Twitter 카드 미리보기' },
  { name: 'gradient',       title: 'CSS 그라데이션 생성기' },
  { name: 'docker-lint',    title: 'Dockerfile Linter & 스니펫' },
  { name: 'gitignore',      title: '.gitignore 생성기' },
  { name: 'emoji-mosaic',   title: '이모지 모자이크 생성기' },
  { name: 'identicon',      title: '픽셀 아바타/Identicon' },
  { name: 'idcard',         title: '가상 신분증/명함 생성기' }
];

// Dynamic page route for each tool
tools.forEach(tool => {
  app.get(`/${tool.name}`, (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', `${tool.name}.html`);
      res.sendFile(filePath, err => {
        if (err) {
          console.error(`${tool.title} 페이지 로드 오류:`, err);
          res.status(404).send(`
            <html>
              <head><title>페이지를 찾을 수 없습니다</title></head>
              <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1>🚧 ${tool.title}</h1>
                <p>이 도구는 현재 개발 중입니다.</p>
                <a href="/" style="color: #6366f1; text-decoration: none;">← 메인 페이지로 돌아가기</a>
              </body>
            </html>
          `);
        }
      });
    } catch (error) {
      console.error(`${tool.title} 라우트 오류:`, error);
      res.status(500).send('서버 오류가 발생했습니다.');
    }
  });
});

// ────────────────────────────────────────────────────────────
// 📡 Existing APIs (compare, json, base64, password, regex)
// ‣ 생략: 기존 코드 그대로 유지 ↓↓↓
// -----------------------------------------------------------------------------
// [중략] ... (이후 기존 API, helpers, error handling, app.listen 등은 변함없음)
// -----------------------------------------------------------------------------

// 서버 시작
app.listen(port, '0.0.0.0', () => {
  console.log('🚀 개발자 도구 모음 서버가 실행 중입니다!');
  console.log(`📍 주소: http://localhost:${port}`);
  console.log(`🛠️  사용 가능한 도구: ${tools.length}개`);
  console.log(`⏰ 시작 시간: ${new Date().toLocaleString('ko-KR')}`);
});
