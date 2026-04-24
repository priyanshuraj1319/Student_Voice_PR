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

        const name = document.getElementById('name').value.trim();
        const roll = document.getElementById('roll').value.trim();
        const dept = document.getElementById('dept').value.trim();
        const category = document.getElementById('category').value;
        const priority = document.getElementById('priority').value;
        const desc = document.getElementById('description').value.trim();

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
    const cat = (document.getElementById('filterCategory')?.value) || 'All';
    const status = (document.getElementById('filterStatus')?.value) || 'All';

    filteredIssues = allIssues.filter(issue => {
        const catMatch = cat === 'All' || issue.category === cat;
        const statusMatch = status === 'All' || issue.status === status;
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
          <option ${issue.status === 'Not Open' ? 'selected' : ''}>Not Open</option>
          <option ${issue.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      </td>` : ''}
    </tr>
  `).join('');
}

if (document.getElementById('issueTableBody')) {
    loadIssues();
}


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


const role = sessionStorage.getItem('role');
const adminLink = document.getElementById('adminLink');
if (adminLink && role === 'student') {
    adminLink.style.display = 'none';
}

function logout() {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('role');
    window.location.replace('login.html'); // use replace, not href
}




/*   login   */

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

    otpTimer = setTimeout(() => {
        popup.classList.add('hidden');
    }, 15000);
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

    if (!generatedOTP) {
        alert('Please generate OTP first!');
        return;
    }

    if (entered === generatedOTP) {
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('role', selectedRole);

        if (selectedRole === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
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


const ADMIN_ID = "abcd";
const ADMIN_PASS = "abcd@1234";

function verifyAdmin() {
    const id = document.getElementById('adminId').value.trim();
    const pass = document.getElementById('adminPass').value.trim();

    if (id === ADMIN_ID && pass === ADMIN_PASS) {
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('role', 'admin');
        window.location.href = 'admin.html';
    } else {
        alert('Wrong ID or Password!');
        document.getElementById('adminId').value = '';
        document.getElementById('adminPass').value = '';
    }
}

(function () {
    const loggedIn = sessionStorage.getItem('loggedIn');
    const role = sessionStorage.getItem('role');
    const page = window.location.pathname.split('/').pop();

    const publicPages = ['login.html', ''];

    if (!loggedIn && !publicPages.includes(page)) {
        window.location.replace('login.html');
        return;
    }

    if (loggedIn && role === 'student' && page === 'admin.html') {
        window.location.replace('index.html');
        return;
    }

    window.addEventListener('popstate', function () {
        const currentPage = window.location.pathname.split('/').pop();
        const isLoggedIn = sessionStorage.getItem('loggedIn');
        const currentRole = sessionStorage.getItem('role');

        if (!isLoggedIn && !publicPages.includes(currentPage)) {
            // Logged out hai aur protected page pe aa gaya — wapas login pe
            window.location.replace('login.html');
        } else if (isLoggedIn && currentRole === 'student' && currentPage === 'admin.html') {
            // Student admin page pe aa gaya — block karo
            window.history.go(1);
        }
    });
})();