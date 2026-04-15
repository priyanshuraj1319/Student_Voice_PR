function toggleMenu() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('active');
}

document.addEventListener('click', function (e) {
  const menu = document.getElementById('dropdownMenu');
  const menuBtn = document.querySelector('.menu') || document.querySelector('.home-menu');
  if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
    menu.classList.remove('active');
  }
});

const btns = document.querySelectorAll('.btn');
if (btns.length >= 2) {
  btns[0].onclick = () => window.location.href = 'report.html';
  btns[1].onclick = () => window.location.href = 'dashboard.html';
}

const issueForm = document.getElementById('issueForm');
if (issueForm) {
  issueForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name     = document.getElementById('name').value.trim();
    const roll     = document.getElementById('roll').value.trim();
    const dept     = document.getElementById('dept').value.trim();
    const category = document.getElementById('category').value;
    const priority = document.getElementById('priority').value;
    const desc     = document.getElementById('description').value.trim();

    if (!name || !category || !priority || !desc) {
      alert('Please fill in all required fields.');
      return;
    }

    let issues = JSON.parse(localStorage.getItem('issues')) || [];

    const issue = {
      id: Date.now(),
      name,
      roll,
      dept,
      category,
      priority,
      description: desc,
      status: 'Not Open'
    };

    issues.push(issue);
    localStorage.setItem('issues', JSON.stringify(issues));

    alert('Issue submitted successfully!');
    issueForm.reset();
  });
}


let allIssues = [];
let filteredIssues = [];
let currentPage = 1;
const rowsPerPage = 5;

function loadIssues() {
  allIssues = JSON.parse(localStorage.getItem('issues')) || [];
  filteredIssues = [...allIssues];
  updateStats();
  renderTable();
}

function updateStats() {
  const total      = allIssues.length;
  const resolved   = allIssues.filter(i => i.status === 'Resolved').length;
  const pending    = allIssues.filter(i => i.status === 'Not Open').length;
  const processing = allIssues.filter(i => i.status === 'Processing').length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('totalCount',      total);
  set('resolvedCount',   resolved);
  set('pendingCount',    pending);
  set('processingCount', processing);
}

function applyFilters() {
  const cat    = (document.getElementById('filterCategory')?.value) || 'All';
  const status = (document.getElementById('filterStatus')?.value)   || 'All';

  filteredIssues = allIssues.filter(issue => {
    const catMatch    = cat    === 'All' || issue.category === cat;
    const statusMatch = status === 'All' || issue.status   === status;
    return catMatch && statusMatch;
  });

  currentPage = 1;
  renderTable();
}

function changePage(dir) {
  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / rowsPerPage));
  currentPage = Math.min(Math.max(1, currentPage + dir), totalPages);
  renderTable();
}

function changeStatus(id, newStatus) {
  let issues = JSON.parse(localStorage.getItem('issues')) || [];
  issues = issues.map(i => i.id === id ? { ...i, status: newStatus } : i);
  localStorage.setItem('issues', JSON.stringify(issues));
  loadIssues();
}

function priorityClass(p) {
  if (p === 'High') return 'priority-high';
  if (p === 'Mid')  return 'priority-mid';
  return 'priority-low';
}

function statusClass(s) {
  if (s === 'Resolved')   return 'status-resolved';
  if (s === 'Processing') return 'status-processing';
  return 'status-notopen';
}

function renderTable() {
  const tbody = document.getElementById('issueTableBody');
  if (!tbody) return;

  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / rowsPerPage));
  const start = (currentPage - 1) * rowsPerPage;
  const pageItems = filteredIssues.slice(start, start + rowsPerPage);

  const pageDisplay = document.getElementById('pageDisplay') || document.getElementById('pageNum');
  if (pageDisplay) pageDisplay.textContent = String(currentPage).padStart(2, '0');

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages;

  const isAdmin = !!document.querySelector('.issue-table thead tr th:last-child') &&
    document.querySelector('.issue-table thead tr th:last-child').textContent.trim() === 'Actions';

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${isAdmin ? 6 : 5}">No issues found.</td></tr>`;
    return;
  }

  tbody.innerHTML = pageItems.map(issue => `
    <tr>
      <td><span class="cell-id">#${String(issue.id).slice(-4)}</span></td>
      <td><span class="cell-badge">${issue.category}</span></td>
      <td style="color:#cce9f8;font-size:13px;">${issue.description}</td>
      <td><span class="${priorityClass(issue.priority)}">${issue.priority}</span></td>
      <td><span class="${statusClass(issue.status)}">${issue.status}</span></td>
      ${isAdmin ? `
      <td>
        <select onchange="changeStatus(${issue.id}, this.value)" style="background:#4a90c4;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:12px;cursor:pointer;">
          <option ${issue.status === 'Not Open'    ? 'selected' : ''}>Not Open</option>
          <option ${issue.status === 'Processing'  ? 'selected' : ''}>Processing</option>
          <option ${issue.status === 'Resolved'    ? 'selected' : ''}>Resolved</option>
        </select>
      </td>` : ''}
    </tr>
  `).join('');
}

// Run on dashboard and admin pages
if (document.getElementById('issueTableBody')) {
  loadIssues();
}


// ── About Page — Photo Upload ────────────────────────────
function triggerUpload(inputId) {
  const el = document.getElementById(inputId);
  if (el) el.click();
}

function loadPhoto(input, photoId, iconId) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img  = document.getElementById(photoId);
    const icon = document.getElementById(iconId);
    img.src = e.target.result;
    img.classList.remove('hidden');
    if (icon) icon.style.display = 'none';
  };
  reader.readAsDataURL(file);
}