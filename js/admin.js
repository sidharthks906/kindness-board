lucide.createIcons();

let currentTab = 'pending';
let allMessages = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const isAdmin = sessionStorage.getItem('isAdminLoggedIn');
  if (isAdmin === 'true') {
    showDashboard();
    loadMessages();
  } else {
    document.getElementById('loginView').style.display = 'flex';
    document.getElementById('dashboardView').style.display = 'none';
  }
});

// Login
function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  
  if (user === 'admin' && pass === 'Trump@1981') {
    sessionStorage.setItem('isAdminLoggedIn', 'true');
    showDashboard();
    loadMessages();
    showToast('Logged in successfully!');
  } else {
    showToast('Invalid credentials. Please try again.', true);
  }
}

// Logout
function logout() {
  sessionStorage.removeItem('isAdminLoggedIn');
  document.getElementById('loginView').style.display = 'flex';
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

function showDashboard() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'block';
}

function loadMessages() {
  allMessages = window.storageEngine.getAllMessages();
  renderDashboard();
}

function renderDashboard() {
  const pending = allMessages.filter(m => m.status === 'pending');
  const approved = allMessages.filter(m => m.status === 'approved');
  const rejected = allMessages.filter(m => m.status === 'rejected');

  document.getElementById('statPending').textContent = pending.length;
  document.getElementById('statApproved').textContent = approved.length;
  document.getElementById('statRejected').textContent = rejected.length;
  document.getElementById('statTotal').textContent = allMessages.length;
  document.getElementById('tabCountPending').textContent = pending.length;

  renderTable(currentTab === 'pending' ? pending : currentTab === 'approved' ? approved : rejected);
}

function switchTab(tabName, element) {
  currentTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');
  renderDashboard();
}

function renderTable(messages) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  if (messages.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No messages found in this queue.</td></tr>`;
    return;
  }

  messages.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(msg => {
    const tr = document.createElement('tr');
    
    let actionsHtml = '';
    if (msg.status === 'pending') {
      actionsHtml = `
        <button class="btn-sm btn-success" onclick="updateStatus('${msg.id}', 'approved')">Approve</button>
        <button class="btn-sm btn-danger" onclick="updateStatus('${msg.id}', 'rejected')">Reject</button>
      `;
    } else if (msg.status === 'approved') {
      actionsHtml = `<button class="btn-sm btn-danger" onclick="updateStatus('${msg.id}', 'rejected')">Reject</button>`;
    } else {
      actionsHtml = `
        <button class="btn-sm btn-success" onclick="updateStatus('${msg.id}', 'approved')">Approve</button>
        <button class="btn-text" onclick="deleteMessage('${msg.id}')">Delete</button>
      `;
    }

    tr.innerHTML = `
      <td><span class="badge badge-success">${msg.category}</span></td>
      <td>
        <strong>${msg.name}</strong><br>
        <small style="color: var(--text-muted)">${msg.relationship}</small>
      </td>
      <td class="message-cell">
        <div class="message-text">"${msg.message}"</div>
      </td>
      <td>${msg.date}</td>
      <td class="actions-cell">${actionsHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateStatus(id, newStatus) {
  if (newStatus === 'approved') {
    window.storageEngine.approveMessage(id);
  } else if (newStatus === 'rejected') {
    window.storageEngine.rejectMessage(id);
  }
  loadMessages();
  showToast(`Message marked as ${newStatus}`);
}

function deleteMessage(id) {
  if (confirm('Are you sure you want to permanently delete this message?')) {
    window.storageEngine.deleteMessage(id);
    loadMessages();
    showToast('Message deleted');
  }
}

function exportMessagesCSV() {
  if (allMessages.length === 0) return showToast('No messages to export');
  
  const headers = ['ID', 'Date', 'Name', 'Email', 'Role', 'Category', 'Status', 'Message'];
  const rows = allMessages.map(m => [
    m.id, m.date, `"${m.name}"`, `"${m.email}"`, m.relationship, m.category, m.status, `"${m.message.replace(/"/g, '""')}"`
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `kindness_board_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showToast(message, isError = false) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  if (isError) toast.style.backgroundColor = 'var(--accent-red)';
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
