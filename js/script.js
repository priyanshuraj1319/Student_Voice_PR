/* ============================================================
   STUDENT VOICE — script.js
   Role-Based Access Control:
     student → index.html, report.html, dashboard.html, about.html
     admin   → admin.html, about.html
   ============================================================ */

// ─── ROUTE PERMISSIONS ────────────────────────────────────────
const ROUTES = {
    public: ['login.html', ''],
    student: ['index.html', 'report.html', 'dashboard.html', 'about.html'],
    admin: ['admin.html', 'about.html']
};

// SHA-256 hash of "abcd:abcd@1234"  (credentials never stored in plain text)
const ADMIN_CREDENTIAL_HASH = '14def29606b1d259eda76e2395d2dcaea002303aa42df4b2bbe36f5bfb5efba5';

// ─── HASH HELPER (Web Crypto API) ─────────────────────────────
async function sha256(str) {
    const buf = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(str)
    );
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ─── CENTRAL ROUTE GUARD ──────────────────────────────────────
// Called on every page load. Redirects if role doesn't match.
function guardRoute() {
    const page = window.location.pathname.split('/').pop() || '';
    const loggedIn = sessionStorage.getItem('loggedIn');
    const role = sessionStorage.getItem('role');

    // Not logged in → only public pages allowed
    if (!loggedIn) {
        if (!ROUTES.public.includes(page)) {
            window.location.replace('login.html');
        }
        return;
    }

    // Logged in → check role permission
    const allowed = ROUTES[role] || [];
    if (!allowed.includes(page) && !ROUTES.public.includes(page)) {
        // Redirect to role's home page
        window.location.replace(role === 'admin' ? 'admin.html' : 'index.html');
    }
}

// Run guard immediately on every page
guardRoute();

// Also guard on back/forward navigation
window.addEventListener('pageshow', function (e) {
    if (e.persisted) guardRoute();
});
window.addEventListener('popstate', guardRoute);


// ─── TOGGLE MENU ──────────────────────────────────────────────
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


// ─── HOME PAGE BUTTONS ────────────────────────────────────────
const btns = document.querySelectorAll('.btn');
if (btns.length >= 2) {
    btns[0].onclick = () => window.location.href = 'report.html';
    btns[1].onclick = () => window.location.href = 'dashboard.html';
}


// ─── REPORT FORM ──────────────────────────────────────────────
const issueForm = document.getElementById('issueForm');
if (issueForm) {
    // Only students should be on this page — extra JS guard
    if (sessionStorage.getItem('role') !== 'student') {
        window.location.replace('admin.html');
    }

    issueForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const roll = document.getElementById('roll').value.trim();
        const dept = document.getElementById('dept').value.trim();
        const category = document.getElementById('category').value;
        const priority = document.getElementById('priority').value;
        const desc = document.getElementById('description').value.trim();

        if (!name || !roll || !dept || !category || !priority || !desc) {
            alert('Fill the form first!');
            return;
        }

        const issues = JSON.parse(localStorage.getItem('issues')) || [];
        const now = new Date();

        issues.push({
            id: Date.now(),
            name,
            roll,
            dept,
            category,
            priority,
            description: desc,
            status: 'Not Open',
            date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        });

        localStorage.setItem('issues', JSON.stringify(issues));
        alert('Issue submitted successfully!');
        issueForm.reset();
        document.getElementById('successOverlay').classList.remove('hidden');
    });
}


// ─── DASHBOARD / ADMIN TABLE ──────────────────────────────────
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
    const total = allIssues.length;
    const resolved = allIssues.filter(i => i.status === 'Resolved').length;
    const pending = allIssues.filter(i => i.status === 'Not Open').length;
    const processing = allIssues.filter(i => i.status === 'Processing').length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('totalCount', total);
    set('resolvedCount', resolved);
    set('pendingCount', pending);
    set('processingCount', processing);
}

function applyFilters() {
    const cat = document.getElementById('filterCategory')?.value || 'All';
    const status = document.getElementById('filterStatus')?.value || 'All';

    filteredIssues = allIssues.filter(issue => {
        return (cat === 'All' || issue.category === cat) &&
            (status === 'All' || issue.status === status);
    });

    currentPage = 1;
    renderTable();
}

function changePage(dir) {
    const totalPages = Math.max(1, Math.ceil(filteredIssues.length / rowsPerPage));
    currentPage = Math.min(Math.max(1, currentPage + dir), totalPages);
    renderTable();
}

// Admin-only: change issue status
function changeStatus(id, newStatus) {
    if (sessionStorage.getItem('role') !== 'admin') return; // guard

    let issues = JSON.parse(localStorage.getItem('issues')) || [];
    issues = issues.map(i => i.id === id ? { ...i, status: newStatus } : i);
    localStorage.setItem('issues', JSON.stringify(issues));
    loadIssues();
}

// Admin-only: delete issue
function deleteIssue(id) {
    if (sessionStorage.getItem('role') !== 'admin') return; // guard

    if (!confirm('Delete this issue? This cannot be undone.')) return;
    let issues = JSON.parse(localStorage.getItem('issues')) || [];
    issues = issues.filter(i => i.id !== id);
    localStorage.setItem('issues', JSON.stringify(issues));
    loadIssues();
}

function priorityClass(p) {
    if (p === 'High') return 'priority-high';
    if (p === 'Mid') return 'priority-mid';
    return 'priority-low';
}

function statusClass(s) {
    if (s === 'Resolved') return 'status-resolved';
    if (s === 'Processing') return 'status-processing';
    return 'status-notopen';
}

function renderTable() {
    const tbody = document.getElementById('issueTableBody');
    if (!tbody) return;

    const isAdmin = sessionStorage.getItem('role') === 'admin';
    const totalPages = Math.max(1, Math.ceil(filteredIssues.length / rowsPerPage));
    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredIssues.slice(start, start + rowsPerPage);

    const pageDisplay = document.getElementById('pageDisplay') || document.getElementById('pageNum');
    if (pageDisplay) pageDisplay.textContent = String(currentPage).padStart(2, '0');

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;

    const colSpan = isAdmin ? 8 : 6;

    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="${colSpan}">No issues found.</td></tr>`;
        return;
    }

    tbody.innerHTML = pageItems.map(issue => `
    <tr>
      <td><span class="cell-id">#${String(issue.id).slice(-4)}</span></td>
      <td><span class="cell-badge">${issue.category}</span></td>
      <td style="color:#cce9f8;font-size:13px;">${issue.description}</td>
      <td style="font-size:12px;color:#aacfe8;">${issue.date || 'N/A'}</td>
      <td><span class="${priorityClass(issue.priority)}">${issue.priority}</span></td>
      <td><span class="${statusClass(issue.status)}">${issue.status}</span></td>
      ${isAdmin ? `
      <td>
        <select onchange="changeStatus(${issue.id}, this.value)"
          style="background:#4a90c4;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-size:12px;cursor:pointer;">
          <option ${issue.status === 'Not Open' ? 'selected' : ''}>Not Open</option>
          <option ${issue.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      </td>
      <td>
        <button onclick="deleteIssue(${issue.id})"
          style="background:#e83030;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;font-weight:700;">
          🗑 Delete
        </button>
      </td>` : ''}
    </tr>
  `).join('');
}

if (document.getElementById('issueTableBody')) {
    loadIssues();
}



// ─── SELECT PLACEHOLDER COLOUR (report.html) ─────────────────
// CSS :valid specificity beats form select, so we use a JS class toggle
document.querySelectorAll('form select').forEach(function (sel) {
    function updateColor() {
        if (sel.value === '') {
            sel.style.color = 'gray';
        } else {
            sel.style.color = '#333';
        }
    }
    updateColor();
    sel.addEventListener('change', updateColor);
});

// ─── ABOUT PAGE — PHOTO UPLOAD ────────────────────────────────
function triggerUpload(inputId) {
    const el = document.getElementById(inputId);
    if (el) el.click();
}

function loadPhoto(input, photoId, iconId) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = document.getElementById(photoId);
        const icon = document.getElementById(iconId);
        img.src = e.target.result;
        img.classList.remove('hidden');
        if (icon) icon.style.display = 'none';
    };
    reader.readAsDataURL(file);
}


// ─── LOGOUT ───────────────────────────────────────────────────
function logout() {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('role');
    window.location.replace('login.html');
}


// ─── LOGIN PAGE LOGIC ─────────────────────────────────────────
// Redirect already-logged-in users away from login page
const pageName = window.location.pathname.split('/').pop() || '';
if (ROUTES.public.includes(pageName) && sessionStorage.getItem('loggedIn')) {
    const role = sessionStorage.getItem('role');
    window.location.replace(role === 'admin' ? 'admin.html' : 'index.html');
}

let selectedRole = '';
let generatedOTP = '';
let otpTimer = null;

function selectRole(role) {
    selectedRole = role;

    const roleScreen = document.getElementById('roleScreen');
    const otpScreen = document.getElementById('otpScreen');
    const title = document.getElementById('portalTitle');
    const adminForm = document.getElementById('adminLoginForm');
    const otpSection = document.getElementById('otpSection');

    if (!roleScreen) return;

    title.textContent = role === 'admin' ? 'ADMIN PORTAL' : 'STUDENT PORTAL';
    roleScreen.classList.add('fade-out');

    setTimeout(() => {
        roleScreen.style.display = 'none';
        otpScreen.style.display = 'flex';
        otpScreen.classList.remove('hidden');
        otpScreen.classList.add('fade-in');

        if (role === 'admin') {
            adminForm.classList.remove('hidden');
            otpSection.style.display = 'none';
        } else {
            adminForm.classList.add('hidden');
            otpSection.style.display = 'block';
        }
    }, 500);
}

function generateOTP() {
    const phone = document.getElementById('phoneInput').value.trim();
    if (phone.length !== 10) {
        alert('Please enter a valid 10-digit number first!');
        return;
    }

    generatedOTP = String(Math.floor(1000 + Math.random() * 9000));
    ['otp1', 'otp2', 'otp3', 'otp4'].forEach(id => {
        document.getElementById(id).value = '';
    });
    showOTPPopup(generatedOTP);
}

function showOTPPopup(otp) {
    const popup = document.getElementById('otpPopup');
    const display = document.getElementById('otpDisplay');
    display.textContent = otp;
    popup.classList.remove('hidden');
    if (otpTimer) clearTimeout(otpTimer);
    otpTimer = setTimeout(() => popup.classList.add('hidden'), 15000);
}

function otpMove(current, nextId) {
    if (current.value.length === 1) {
        const next = document.getElementById(nextId);
        if (next) next.focus();
    }
}

function verifyOTP() {
    const entered =
        document.getElementById('otp1').value +
        document.getElementById('otp2').value +
        document.getElementById('otp3').value +
        document.getElementById('otp4').value;

    if (!generatedOTP) { alert('Please generate OTP first!'); return; }

    if (entered === generatedOTP) {
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('role', 'student');
        window.location.href = 'index.html';
    } else {
        alert('Wrong OTP! Please try again.');
        ['otp1', 'otp2', 'otp3', 'otp4'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('otp1').focus();
    }
}

function goBack() {
    const otpScreen = document.getElementById('otpScreen');
    const roleScreen = document.getElementById('roleScreen');
    if (!otpScreen) return;

    otpScreen.classList.add('fade-out');
    setTimeout(() => {
        otpScreen.style.display = 'none';
        otpScreen.classList.remove('fade-in', 'fade-out');
        document.getElementById('phoneInput').value = '';
        ['otp1', 'otp2', 'otp3', 'otp4'].forEach(id => {
            document.getElementById(id).value = '';
        });
        generatedOTP = '';
        roleScreen.style.display = 'flex';
        roleScreen.classList.remove('fade-out');
        roleScreen.classList.add('fade-in');
    }, 500);
}

// Admin login — compares SHA-256 hash, NOT plaintext
async function verifyAdmin() {
    const id = document.getElementById('adminId').value.trim();
    const pass = document.getElementById('adminPass').value.trim();

    if (!id || !pass) { alert('Please enter Admin ID and Password.'); return; }

    const hash = await sha256(id + ':' + pass);

    if (hash === ADMIN_CREDENTIAL_HASH) {
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('role', 'admin');
        window.location.href = 'admin.html';
    } else {
        alert('Wrong ID or Password!');
        document.getElementById('adminId').value = '';
        document.getElementById('adminPass').value = '';
    }
}