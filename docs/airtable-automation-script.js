// ================================================
// BIZEN - Airtable Automation Script
// ================================================
// 작성일: 2025-12-18
// 수정일: 2025-12-25
// 용도: Meta 리드 수신 시 Worker 호출 (이메일 + 텔레그램)
// 트리거: When record is created → Run a script
// 흐름: Meta Lead → Make → Airtable → Worker(알림)
// ================================================

/**
 * Airtable Automation 설정 방법:
 *
 * 1. Airtable 접속 → Base 열기 (appyF7vS226K95heO)
 * 2. 상단 "Automations" 클릭
 * 3. "+ Create automation" 클릭
 * 4. 이름: "Meta 리드 알림 발송"
 *
 * 5. 트리거 설정:
 *    - "When record is created" 선택
 *    - Table: "고객정보"
 *
 * 6. 액션 설정:
 *    - "+ Add action" 클릭
 *    - "Run a script" 선택
 *    - 아래 코드 전체 복사 → 붙여넣기
 *
 * 7. Input variables 설정 (Configure 클릭):
 *    - recordId: Record ID 선택
 *
 * 8. "Test step" 클릭하여 테스트
 * 9. 성공 시 토글 ON (활성화)
 */

// ================================================
// Input Variables 설정
// ================================================

let inputConfig = input.config();
let recordId = inputConfig.recordId;

console.log('🔍 받은 recordId:', recordId);

// ================================================
// 테이블에서 레코드 가져오기
// ================================================

let table = base.getTable('고객정보');
let record = await table.selectRecordAsync(recordId);

if (!record) {
    console.log('❌ 레코드를 찾을 수 없습니다.');
    output.set('status', 'error');
    output.set('error', 'Record not found');
    return;
}

console.log('📋 레코드 조회 성공:', record.id);

// ================================================
// 필드값 추출 (2025-12-25 수정: 실제 필드명 반영)
// ================================================
// 필드 목록:
// - date (날짜)
// - 플랫폼
// - 광고명
// - 사업자종류
// - 지역
// - 이름
// - 연락처
// - 상호명
// - 업종
// - 직전년도매출
// - 필요자금
// - 안내고지
// - 상담희망시간
// ================================================

const data = {
    date: record.getCellValue('date') || '-',
    플랫폼: record.getCellValue('플랫폼') || 'Meta',
    광고명: record.getCellValue('광고명') || '-',
    사업자종류: record.getCellValue('사업자종류') || '-',
    지역: record.getCellValue('지역') || '-',
    이름: record.getCellValue('이름') || '-',
    연락처: record.getCellValue('연락처') || '-',
    상호명: record.getCellValue('상호명') || '-',
    업종: record.getCellValue('업종') || '-',
    직전년도매출: record.getCellValue('직전년도매출') || '-',
    필요자금: record.getCellValue('필요자금') || '-',
    안내고지: record.getCellValue('안내고지') || '-',
    상담희망시간: record.getCellValue('상담희망시간') || '-'
};

console.log('📋 추출된 데이터:', JSON.stringify(data));

// ================================================
// Worker 호출
// ================================================

const WORKER_URL = 'https://meta-bizen.weandbiz.workers.dev/';

try {
    console.log('🚀 Worker 호출 시작...');

    const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok && result.success) {
        console.log('✅ Worker 호출 성공!');
        console.log('📧 이메일:', result.email?.success ? '성공' : '실패');
        console.log('📱 텔레그램:', result.telegram?.success ? '성공' : '실패');

        output.set('status', 'success');
        output.set('email_status', result.email?.success ? 'sent' : 'failed');
        output.set('telegram_status', result.telegram?.success ? 'sent' : 'failed');
    } else {
        console.log('❌ Worker 호출 실패');
        console.log('에러:', JSON.stringify(result));

        output.set('status', 'failed');
        output.set('error', result.error || 'Unknown error');
    }

} catch (error) {
    console.log('❌ 요청 중 오류 발생');
    console.log('에러 메시지:', error.message);

    output.set('status', 'error');
    output.set('error', error.message);
}

// ================================================
// 설정 정보
// ================================================

/**
 * Airtable:
 * - Base ID: appyF7vS226K95heO
 * - Table ID: tblPpgdyxAa7IupGV
 * - Table: 고객정보
 * - View: viwpgrGcoeHdu6s6w
 * - Share URL: https://airtable.com/appyF7vS226K95heO/tblPpgdyxAa7IupGV/viwpgrGcoeHdu6s6w
 *
 * Worker:
 * - URL: https://meta-bizen.weandbiz.workers.dev/
 *
 * 이메일 수신:
 * - TO: bizregen119@gmail.com
 * - BCC: mkt@polarad.co.kr
 *
 * 텔레그램:
 * - Chat ID: -1003263192918
 *
 * 브랜드 정보:
 * - 회사명: BIZEN
 * - 대표자: 김우영
 * - 대표번호: 1668-3166
 *
 * 변경 이력:
 * - 2025-12-18: 최초 작성
 * - 2025-12-25: 필드명 수정 (no → date, 사업자종류/안내고지 추가)
 */
