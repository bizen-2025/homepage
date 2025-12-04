const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const DIST_DIR = path.join(__dirname, 'dist');

// dist 폴더 생성
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 빌드할 페이지 목록
const pages = ['index.html', 'about.html', 'process.html', 'fund.html', 'service.html', 'marketing.html'];

pages.forEach(pageName => {
    const templatePath = path.join(SRC_DIR, pageName);

    if (!fs.existsSync(templatePath)) {
        console.log(`⏭ 스킵: ${pageName} (파일 없음)`);
        return;
    }

    let html = fs.readFileSync(templatePath, 'utf8');

    // <!-- include:파일명.html --> 패턴 찾아서 교체
    const includePattern = /<!--\s*include:(\S+)\s*-->/g;

    html = html.replace(includePattern, (match, filename) => {
        const componentPath = path.join(COMPONENTS_DIR, filename);

        if (fs.existsSync(componentPath)) {
            const content = fs.readFileSync(componentPath, 'utf8');
            console.log(`✓ 포함됨: ${filename}`);
            return content;
        } else {
            console.warn(`⚠ 파일 없음: ${filename}`);
            return `<!-- 파일 없음: ${filename} -->`;
        }
    });

    // dist로 저장
    const outputPath = path.join(DIST_DIR, pageName);
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`📄 빌드됨: ${pageName}`);
});

console.log('\n✅ 빌드 완료!');

// CSS, JS, 이미지 파일도 dist로 복사
const filesToCopy = ['css', 'js', 'images'];
const rootFiles = fs.readdirSync(__dirname);

// 이미지 파일들 (png, jpg, svg 등) 복사
rootFiles.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.ico'].includes(ext)) {
        const src = path.join(__dirname, file);
        const dest = path.join(DIST_DIR, file);
        fs.copyFileSync(src, dest);
        console.log(`✓ 복사됨: ${file}`);
    }
});

// css, js 폴더 복사
filesToCopy.forEach(folder => {
    const srcFolder = path.join(__dirname, folder);
    const destFolder = path.join(DIST_DIR, folder);

    if (fs.existsSync(srcFolder)) {
        copyFolderSync(srcFolder, destFolder);
        console.log(`✓ 폴더 복사됨: ${folder}/`);
    }
});

function copyFolderSync(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);

        if (fs.statSync(srcPath).isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

console.log('\n🚀 프로덕션 준비 완료! dist/ 폴더를 배포하세요.');
