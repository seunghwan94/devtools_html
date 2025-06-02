const express = require('express');
const path = require('path');
const Diff = require('diff');
const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json({ limit: '10mb' })); // JSON 파싱 크기 제한
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL 인코딩 파싱

// 정적 파일 제공 (CSS, JS, 이미지 등)
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 보안 헤더 설정
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// 로깅 미들웨어
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 메인 페이지 라우트
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'views', 'index.html'));
    } catch (error) {
        console.error('메인 페이지 로드 오류:', error);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

// 각 도구별 라우팅 설정
const tools = [
    { name: 'compare', title: '코드/텍스트 비교 도구' },
    { name: 'json', title: 'JSON 포매터 & 검증' },
    { name: 'markdown', title: 'Markdown 미리보기' },
    { name: 'base64', title: 'Base64 인코딩/디코딩' },
    { name: 'image-resize', title: '이미지 압축 & 크기 조정' },
    { name: 'password', title: '랜덤 패스워드 생성' },
    { name: 'shorturl', title: 'URL 단축기' },
    { name: 'regex', title: 'Regex 테스터' },
    { name: 'ipinfo', title: 'IP 주소 정보 확인' },
    { name: 'notepad', title: '온라인 메모장' },
    { name: 'fileconvert', title: '파일 타입 변환기' },
    { name: 'qrcode', title: 'QR 코드 생성기' }
];

// 각 도구 페이지 라우트
tools.forEach(tool => {
    app.get(`/${tool.name}`, (req, res) => {
        try {
            const filePath = path.join(__dirname, 'views', `${tool.name}.html`);
            res.sendFile(filePath, (err) => {
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

// API 라우트들

// 1. 코드/텍스트 비교 API
app.post('/api/compare', (req, res) => {
    try {
        const { leftText, rightText, compareType = 'words' } = req.body;
        
        if (!leftText || !rightText) {
            return res.status(400).json({ 
                error: '비교할 텍스트가 충분하지 않습니다.',
                success: false 
            });
        }

        let differences;
        switch (compareType) {
            case 'lines':
                differences = Diff.diffLines(leftText, rightText);
                break;
            case 'chars':
                differences = Diff.diffChars(leftText, rightText);
                break;
            case 'words':
            default:
                differences = Diff.diffWords(leftText, rightText);
                break;
        }

        res.json({
            success: true,
            differences: differences,
            stats: {
                totalChanges: differences.filter(part => part.added || part.removed).length,
                additions: differences.filter(part => part.added).length,
                deletions: differences.filter(part => part.removed).length
            }
        });
    } catch (error) {
        console.error('텍스트 비교 오류:', error);
        res.status(500).json({ 
            error: '텍스트 비교 중 오류가 발생했습니다.',
            success: false 
        });
    }
});

// 2. JSON 포매터 & 검증 API
app.post('/api/json', (req, res) => {
    try {
        const { jsonString, action = 'format' } = req.body;
        
        if (!jsonString) {
            return res.status(400).json({ 
                error: 'JSON 문자열이 필요합니다.',
                success: false 
            });
        }

        let parsedJson;
        try {
            parsedJson = JSON.parse(jsonString);
        } catch (parseError) {
            return res.status(400).json({
                error: 'Invalid JSON: ' + parseError.message,
                success: false,
                line: parseError.message.match(/position (\d+)/)?.[1] || null
            });
        }

        let result;
        switch (action) {
            case 'minify':
                result = JSON.stringify(parsedJson);
                break;
            case 'format':
            default:
                result = JSON.stringify(parsedJson, null, 2);
                break;
        }

        res.json({
            success: true,
            result: result,
            stats: {
                keys: countKeys(parsedJson),
                size: result.length,
                type: Array.isArray(parsedJson) ? 'array' : typeof parsedJson
            }
        });
    } catch (error) {
        console.error('JSON 처리 오류:', error);
        res.status(500).json({ 
            error: 'JSON 처리 중 오류가 발생했습니다.',
            success: false 
        });
    }
});

// 3. Base64 인코딩/디코딩 API
app.post('/api/base64', (req, res) => {
    try {
        const { text, action } = req.body;
        
        if (!text) {
            return res.status(400).json({ 
                error: '텍스트가 필요합니다.',
                success: false 
            });
        }

        let result;
        if (action === 'encode') {
            result = Buffer.from(text, 'utf8').toString('base64');
        } else if (action === 'decode') {
            try {
                result = Buffer.from(text, 'base64').toString('utf8');
            } catch (decodeError) {
                return res.status(400).json({
                    error: '올바르지 않은 Base64 문자열입니다.',
                    success: false
                });
            }
        } else {
            return res.status(400).json({
                error: '올바르지 않은 액션입니다. (encode 또는 decode)',
                success: false
            });
        }

        res.json({
            success: true,
            result: result,
            originalLength: text.length,
            resultLength: result.length
        });
    } catch (error) {
        console.error('Base64 처리 오류:', error);
        res.status(500).json({ 
            error: 'Base64 처리 중 오류가 발생했습니다.',
            success: false 
        });
    }
});

// 4. 패스워드 생성 API
app.post('/api/password', (req, res) => {
    try {
        const { 
            length = 12, 
            includeUppercase = true, 
            includeLowercase = true, 
            includeNumbers = true, 
            includeSymbols = false,
            excludeSimilar = false 
        } = req.body;

        if (length < 4 || length > 128) {
            return res.status(400).json({
                error: '패스워드 길이는 4-128자 사이여야 합니다.',
                success: false
            });
        }

        let charset = '';
        if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (excludeSimilar) {
            charset = charset.replace(/[0O1lI]/g, '');
        }

        if (!charset) {
            return res.status(400).json({
                error: '최소 하나의 문자 타입을 선택해야 합니다.',
                success: false
            });
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        // 패스워드 강도 계산
        const strength = calculatePasswordStrength(password);

        res.json({
            success: true,
            password: password,
            strength: strength,
            options: {
                length,
                includeUppercase,
                includeLowercase,
                includeNumbers,
                includeSymbols,
                excludeSimilar
            }
        });
    } catch (error) {
        console.error('패스워드 생성 오류:', error);
        res.status(500).json({ 
            error: '패스워드 생성 중 오류가 발생했습니다.',
            success: false 
        });
    }
});

// 5. 정규표현식 테스터 API
app.post('/api/regex', (req, res) => {
    try {
        const { pattern, flags = 'g', testString } = req.body;
        
        if (!pattern) {
            return res.status(400).json({ 
                error: '정규표현식 패턴이 필요합니다.',
                success: false 
            });
        }

        let regex;
        try {
            regex = new RegExp(pattern, flags);
        } catch (regexError) {
            return res.status(400).json({
                error: '올바르지 않은 정규표현식입니다: ' + regexError.message,
                success: false
            });
        }

        const matches = [];
        if (testString) {
            let match;
            while ((match = regex.exec(testString)) !== null) {
                matches.push({
                    match: match[0],
                    index: match.index,
                    groups: match.slice(1)
                });
                if (!flags.includes('g')) break;
            }
        }

        res.json({
            success: true,
            pattern: pattern,
            flags: flags,
            matches: matches,
            matchCount: matches.length,
            isValid: true
        });
    } catch (error) {
        console.error('정규표현식 테스트 오류:', error);
        res.status(500).json({ 
            error: '정규표현식 테스트 중 오류가 발생했습니다.',
            success: false 
        });
    }
});

// 헬퍼 함수들
function countKeys(obj, count = 0) {
    if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
            count++;
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                count = countKeys(obj[key], count);
            }
        }
    }
    return count;
}

function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];

    // 길이 점수
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // 문자 타입 점수
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // 강도 레벨 결정
    let level, color;
    if (score < 3) {
        level = '약함';
        color = '#ef4444';
        feedback.push('더 긴 패스워드를 사용하세요');
        feedback.push('다양한 문자 타입을 포함하세요');
    } else if (score < 5) {
        level = '보통';
        color = '#f59e0b';
        feedback.push('특수문자를 추가하면 더 안전합니다');
    } else if (score < 7) {
        level = '강함';
        color = '#10b981';
    } else {
        level = '매우 강함';
        color = '#059669';
    }

    return { score, level, color, feedback };
}

// 404 에러 핸들링
app.use('*', (req, res) => {
    res.status(404).send(`
        <html>
            <head>
                <title>404 - 페이지를 찾을 수 없습니다</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                    .container { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; display: inline-block; }
                    h1 { font-size: 4rem; margin: 0; }
                    p { font-size: 1.2rem; margin: 20px 0; }
                    a { color: #fbbf24; text-decoration: none; font-weight: bold; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>404</h1>
                    <p>요청하신 페이지를 찾을 수 없습니다.</p>
                    <a href="/">← 메인 페이지로 돌아가기</a>
                </div>
            </body>
        </html>
    `);
});

// 전역 에러 핸들링
app.use((error, req, res, next) => {
    console.error('서버 오류:', error);
    res.status(500).json({
        error: '내부 서버 오류가 발생했습니다.',
        success: false
    });
});

// 서버 시작
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 개발자 도구 모음 서버가 실행 중입니다!`);
    console.log(`📍 주소: http://localhost:${port}`);
    console.log(`🛠️  사용 가능한 도구: ${tools.length}개`);
    console.log(`⏰ 시작 시간: ${new Date().toLocaleString('ko-KR')}`);
});