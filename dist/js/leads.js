/* ================================================
   BIZEN 접수내역 JavaScript
   ================================================ */

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  loadSidebar('leads');
  loadDashboardHeader('접수내역', '상담 신청 접수 내역을 관리합니다');
});

// 전체 선택
function toggleSelectAll() {
  const selectAll = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('.lead-checkbox');
  checkboxes.forEach(cb => cb.checked = selectAll.checked);
}

// 검색
function searchLeads() {
  const keyword = document.getElementById('searchInput').value;
  console.log('검색:', keyword);
  // TODO: 검색 API 호출
}

// 엑셀 다운로드
function exportToExcel() {
  alert('엑셀 다운로드 기능은 Airtable 연동 후 활성화됩니다.');
  // TODO: 엑셀 내보내기 API 호출
}

// 상태 변경
function updateStatus(select) {
  const row = select.closest('tr');
  const status = select.value;

  // 클래스 업데이트
  select.className = 'status-select ' + status;

  console.log('상태 변경:', status);
  // TODO: 상태 업데이트 API 호출
}

// 메모 저장
function saveMemo(input) {
  const row = input.closest('tr');
  const memo = input.value;

  console.log('메모 저장:', memo);
  // TODO: 메모 저장 API 호출
}

// 상세보기
function viewDetail(btn) {
  const row = btn.closest('tr');
  const cells = row.querySelectorAll('td');

  // 모달에 데이터 표시 (샘플)
  document.getElementById('detailDate').textContent = cells[1].textContent;
  document.getElementById('detailName').textContent = cells[2].textContent;
  document.getElementById('detailPhone').textContent = cells[3].textContent;
  document.getElementById('detailCompany').textContent = cells[4].textContent;
  document.getElementById('detailBusiness').textContent = cells[5].textContent;
  document.getElementById('detailAmount').textContent = cells[6].textContent;

  document.getElementById('detailModal').classList.add('open');
}

// 상세보기 모달 닫기
function closeDetailModal() {
  document.getElementById('detailModal').classList.remove('open');
}

// 전화걸기
function callCustomer() {
  const phone = document.getElementById('detailPhone').textContent;
  window.location.href = 'tel:' + phone.replace(/-/g, '');
}

// 삭제
function deleteLead(btn) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  const row = btn.closest('tr');
  row.remove();

  // 총 개수 업데이트
  const count = document.querySelectorAll('#leadsTableBody tr').length;
  document.getElementById('totalCount').textContent = count;

  // TODO: 삭제 API 호출
}

// 필터 변경
document.getElementById('statusFilter')?.addEventListener('change', function() {
  console.log('상태 필터:', this.value);
  // TODO: 필터링 적용
});

document.getElementById('dateFilter')?.addEventListener('change', function() {
  console.log('기간 필터:', this.value);
  // TODO: 필터링 적용
});

// 엔터키로 검색
document.getElementById('searchInput')?.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    searchLeads();
  }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeDetailModal();
  }
});

// 모달 외부 클릭 시 닫기
document.getElementById('detailModal')?.addEventListener('click', function(e) {
  if (e.target === this) {
    closeDetailModal();
  }
});
