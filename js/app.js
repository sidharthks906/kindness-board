/* ==========================================================================
   KINDNESS BOARD - MAIN APPLICATION LOGIC
   ========================================================================== */

let currentCategory = 'all';
let currentSearchQuery = '';
let currentSort = 'newest';
let visibleCount = 6; // For pagination / load more
let currentAdminTab = 'pending';
let captchaAnswer = 8; // Default 5+3

// DRAFT AUTO-SAVE KEY
const STORAGE_KEY_DRAFT = 'kindness_form_draft_v1';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // 2. Initialize Floating Ambient Canvas
  initAmbientCanvas();

  // 3. Initialize Captcha Challenge
  generateCaptcha();

  // 4. Restore Form Draft if available
  restoreFormDraft();

  // 5. Render Core Components
  renderStats();
  renderDailyFeatured();
  renderBoard();

  // 6. Setup QR Code
  initQRCode();
});

/* ==========================================================================
   AMBIENT PARTICLES CANVAS (Leaves, Stars, Hearts)
   ========================================================================== */
function initAmbientCanvas() {
  const canvas = document.getElementById('ambientCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleTypes = ['🌸', '🍃', '✨', '🤍', '🌿'];
  const numParticles = 22;

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 14 + 10,
      symbol: particleTypes[Math.floor(Math.random() * particleTypes.length)],
      speedY: Math.random() * 0.4 + 0.1,
      speedX: Math.sin(Math.random() * Math.PI * 2) * 0.3,
      opacity: Math.random() * 0.5 + 0.2,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 0.5
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.y -= p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;

      if (p.y < -30) {
        p.y = height + 30;
        p.x = Math.random() * width;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.font = `${p.size}px sans-serif`;
      ctx.fillText(p.symbol, 0, 0);
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   STATISTICS & ANIMATED COUNTERS
   ========================================================================== */
function renderStats() {
  const stats = window.storageEngine.getStats();

  animateCounter('statTotalMessages', stats.approvedCount + stats.pendingCount);
  animateCounter('statParticipants', stats.participantsCount);
  animateCounter('statDelivered', stats.deliveredCount);
  animateCounter('statDays', stats.daysActive);
}

function animateCounter(elementId, targetVal) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let current = 0;
  const duration = 1200;
  const stepTime = 30;
  const steps = duration / stepTime;
  const increment = targetVal / steps;

  const timer = setInterval(() => {
    current += increment;
    if (current >= targetVal) {
      el.textContent = targetVal;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current);
    }
  }, stepTime);
}

/* ==========================================================================
   DAILY FEATURED MESSAGE
   ========================================================================== */
function renderDailyFeatured() {
  const featured = window.storageEngine.getDailyFeatured();
  const bodyEl = document.getElementById('featuredMessageBody');
  if (!bodyEl) return;

  if (!featured) {
    bodyEl.innerHTML = `<p style="color: var(--text-muted);">No featured message available right now.</p>`;
    return;
  }

  const categoryBadge = getCategoryBadgeHTML(featured.category);
  const authorDisplay = featured.name ? `${featured.name} (${featured.relationship})` : `Anonymous ${featured.relationship}`;

  bodyEl.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
      ${categoryBadge}
      <span style="font-size: 0.8rem; color: var(--text-muted);">${featured.date}</span>
    </div>
    <p style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 600; color: var(--text-main); margin-bottom: 1rem; line-height: 1.5;">
      “${featured.message}”
    </p>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 0.9rem; font-weight: 700; color: var(--primary);">— ${authorDisplay}</span>
      <button class="warmth-btn" onclick="addWarmth('${featured.id}', this)">
        <i data-lucide="heart"></i> Send Warmth (${featured.warmthCount || 0})
      </button>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function loadNextFeatured() {
  window.storageEngine.rotateDailyFeatured();
  renderDailyFeatured();
  showToast('✨ Updated Daily Featured Message!');
}

/* ==========================================================================
   PUBLIC KINDNESS BOARD & MASONRY GRID
   ========================================================================== */
function renderBoard() {
  const gridEl = document.getElementById('boardGrid');
  if (!gridEl) return;

  let messages = window.storageEngine.getApprovedMessages();

  // Category Filter
  if (currentCategory !== 'all') {
    messages = messages.filter(m => m.category === currentCategory);
  }

  // Search Filter
  if (currentSearchQuery.trim()) {
    const q = currentSearchQuery.toLowerCase();
    messages = messages.filter(m => 
      m.message.toLowerCase().includes(q) ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      m.category.toLowerCase().includes(q) ||
      m.relationship.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (currentSort === 'newest') {
    messages.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (currentSort === 'oldest') {
    messages.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (currentSort === 'warmth') {
    messages.sort((a, b) => (b.warmthCount || 0) - (a.warmthCount || 0));
  }

  if (messages.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: #ffffff; border-radius: var(--radius-md); border: 1px dashed var(--border-light);">
        <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">🌸</p>
        <h3 style="margin-bottom: 0.5rem;">No Messages Found</h3>
        <p style="color: var(--text-muted);">Be the first to share a message of kindness in this category!</p>
        <a href="#submit" class="btn btn-primary" style="margin-top: 1rem;">Share Kindness Now</a>
      </div>
    `;
    document.getElementById('boardFooterAction').style.display = 'none';
    return;
  }

  // Paginate visible count
  const visibleMessages = messages.slice(0, visibleCount);

  if (messages.length > visibleCount) {
    document.getElementById('boardFooterAction').style.display = 'block';
  } else {
    document.getElementById('boardFooterAction').style.display = 'none';
  }

  gridEl.innerHTML = visibleMessages.map(msg => createCardHTML(msg)).join('');

  if (window.lucide) lucide.createIcons();
}

function createCardHTML(msg) {
  const badgeHTML = getCategoryBadgeHTML(msg.category);
  const authorName = msg.name ? msg.name : 'Anonymous';
  const authorRole = msg.relationship ? msg.relationship : 'Contributor';

  return `
    <div class="message-card">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          ${badgeHTML}
          <span style="font-size: 0.75rem; color: var(--text-light); font-weight: 600;">${msg.date}</span>
        </div>
        <p class="message-text">“${escapeHTML(msg.message)}”</p>
      </div>
      <div class="card-footer">
        <div class="author-info">
          <span class="author-name">${escapeHTML(authorName)}</span>
          <span class="author-role">${escapeHTML(authorRole)}</span>
        </div>
        <button class="warmth-btn" onclick="addWarmth('${msg.id}', this)" title="Send love & warmth">
          <i data-lucide="heart"></i> <span>${msg.warmthCount || 0}</span>
        </button>
      </div>
    </div>
  `;
}

function getCategoryBadgeHTML(category) {
  let badgeClass = 'badge-hope';
  let emoji = '🌿';

  switch (category) {
    case 'Prayer': badgeClass = 'badge-prayer'; emoji = '🕊️'; break;
    case 'Gratitude': badgeClass = 'badge-gratitude'; emoji = '🌸'; break;
    case 'Encouragement': badgeClass = 'badge-encouragement'; emoji = '💪'; break;
    case 'Thank You Caregiver': badgeClass = 'badge-caregiver'; emoji = '❤️'; break;
    case 'Inspirational Quote': badgeClass = 'badge-quote'; emoji = '✨'; break;
    case 'General Kindness': badgeClass = 'badge-general'; emoji = '☀️'; break;
    default: badgeClass = 'badge-hope'; emoji = '🌿'; break;
  }

  return `<span class="card-category-badge ${badgeClass}">${emoji} ${category}</span>`;
}

function filterCategory(category, btnEl) {
  currentCategory = category;
  visibleCount = 6;
  
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');

  renderBoard();
}

function handleBoardSearch() {
  const input = document.getElementById('boardSearchInput');
  currentSearchQuery = input.value;
  visibleCount = 6;
  renderBoard();
}

function loadMoreMessages() {
  visibleCount += 6;
  renderBoard();
  showToast('Loaded more messages of hope');
}

function addWarmth(msgId, btnEl) {
  const newCount = window.storageEngine.incrementWarmth(msgId);
  if (btnEl) {
    btnEl.classList.add('active');
    const countSpan = btnEl.querySelector('span');
    if (countSpan) countSpan.textContent = newCount;
  }
  showToast('❤️ Warmth sent to this message!');
  
  // Trigger gentle confetti burst
  if (window.confetti) {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 }
    });
  }
}

/* ==========================================================================
   SUBMIT MESSAGE FORM & AI HELPER & CAPTCHA
   ========================================================================== */
function generateCaptcha() {
  const n1 = Math.floor(Math.random() * 5) + 1;
  const n2 = Math.floor(Math.random() * 5) + 1;
  captchaAnswer = n1 + n2;
  const questionEl = document.getElementById('captchaQuestion');
  if (questionEl) {
    questionEl.textContent = `What is ${n1} + ${n2}?`;
  }
}

function handleMessageInput() {
  const textarea = document.getElementById('messageContent');
  const counterEl = document.getElementById('charCount');
  const feedbackEl = document.getElementById('aiFeedback');

  const val = textarea.value;
  counterEl.textContent = val.length;

  if (val.length > 250) {
    counterEl.style.color = '#E11D48';
  } else {
    counterEl.style.color = 'var(--text-muted)';
  }

  // Real-time AI Safety & Profanity check
  if (val.length > 5 && window.aiHelper) {
    const safety = window.aiHelper.checkContentSafety(val);
    if (!safety.isSafe) {
      feedbackEl.style.color = '#E11D48';
      const censoredWords = safety.detectedWords.map(w => w[0] + '*'.repeat(w.length - 1)).join(', ');
      feedbackEl.textContent = `⚠️ Blacklisted word(s) detected: ${censoredWords} — Please revise before submitting.`;
    } else {
      feedbackEl.style.color = 'var(--accent-green)';
      feedbackEl.textContent = '✨ Message looks gentle & appropriate';

      // Auto category classification suggestion
      const suggestedCategory = window.aiHelper.detectCategory(val);
      const categorySelect = document.getElementById('messageCategory');
      if (categorySelect && val.length > 15) {
        categorySelect.value = suggestedCategory;
      }
    }
  } else {
    feedbackEl.textContent = '';
  }

  triggerAutoSave();
}

function generateAiSuggestion() {
  const textarea = document.getElementById('messageContent');
  if (!textarea) return;

  const suggestion = window.aiHelper.expandWording(textarea.value);
  textarea.value = suggestion;
  handleMessageInput();
  showToast('✨ AI Wording suggestion applied!');
}

function triggerAutoSave() {
  const name = document.getElementById('authorName').value;
  const email = document.getElementById('authorEmail').value;
  const relationship = document.getElementById('authorRelationship').value;
  const category = document.getElementById('messageCategory').value;
  const message = document.getElementById('messageContent').value;

  const draft = { name, email, relationship, category, message };
  localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draft));

  const draftNotice = document.getElementById('draftNotice');
  if (draftNotice && message.length > 3) {
    draftNotice.style.display = 'inline-flex';
  }
}

function restoreFormDraft() {
  const draftStr = localStorage.getItem(STORAGE_KEY_DRAFT);
  if (!draftStr) return;

  try {
    const draft = JSON.parse(draftStr);
    if (draft.name) document.getElementById('authorName').value = draft.name;
    if (draft.email) document.getElementById('authorEmail').value = draft.email;
    if (draft.relationship) document.getElementById('authorRelationship').value = draft.relationship;
    if (draft.category) document.getElementById('messageCategory').value = draft.category;
    if (draft.message) {
      document.getElementById('messageContent').value = draft.message;
      handleMessageInput();
    }
  } catch (e) {
    console.error('Failed to restore draft', e);
  }
}

function handleMessageSubmit(event) {
  event.preventDefault();

  const rawName = document.getElementById('authorName').value;
  const email = document.getElementById('authorEmail').value;
  const relationship = document.getElementById('authorRelationship').value;
  const showNamePublicly = document.getElementById('showNamePublicly').checked;
  const name = showNamePublicly ? rawName : 'Anonymous';
  const category = document.getElementById('messageCategory').value;
  const message = document.getElementById('messageContent').value;
  const captchaInput = parseInt(document.getElementById('captchaInput').value, 10);
  const confirmCheck = document.getElementById('confirmRespect').checked;

  if (!message || message.trim().length < 10) {
    showToast('⚠️ Please write a message of at least 10 characters.');
    return;
  }

  if (captchaInput !== captchaAnswer) {
    showToast('⚠️ Verification answer is incorrect. Please try again.');
    generateCaptcha();
    return;
  }

  if (!confirmCheck) {
    showToast('⚠️ Please check the confirmation box.');
    return;
  }

  // Profanity & Safety scan — show blacklist popup if violation detected
  const safety = window.aiHelper.checkContentSafety(message);
  if (!safety.isSafe) {
    showBlacklistPopup(safety.detectedWords);
    return;
  }

  // Submit message to storage
  const newMsg = window.storageEngine.addMessage({ name, email, relationship, category, message });

  // Clear draft
  localStorage.removeItem(STORAGE_KEY_DRAFT);
  document.getElementById('draftNotice').style.display = 'none';

  // Celebration animation
  if (window.confetti) {
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 }
    });
  }

  // Show Success Screen
  document.getElementById('kindnessForm').style.display = 'none';
  const successScreen = document.getElementById('submitSuccessScreen');
  successScreen.classList.remove('hidden');
  document.getElementById('submittedPreviewText').textContent = `“${message}”`;

  // Update board and stats
  renderBoard();
  renderDailyFeatured();
  renderStats();
  renderAdminPanel();
}

function resetSubmissionForm() {
  document.getElementById('kindnessForm').reset();
  document.getElementById('kindnessForm').style.display = 'block';
  document.getElementById('submitSuccessScreen').classList.add('hidden');
  document.getElementById('charCount').textContent = '0';
  document.getElementById('aiFeedback').textContent = '';
  generateCaptcha();
}

function submitForReview() {
  const rawName = document.getElementById('authorName').value;
  const email = document.getElementById('authorEmail').value;
  const relationship = document.getElementById('authorRelationship').value;
  const category = document.getElementById('messageCategory').value;
  const message = document.getElementById('messageContent').value;
  const showNamePublicly = document.getElementById('showNamePublicly').checked;
  const name = showNamePublicly ? rawName : 'Anonymous';

  // Add the message (it auto-inserts as 'approved')
  const newMsg = window.storageEngine.addMessage({ name, email, relationship, category, message });

  // Immediately set it to 'pending' so it goes to admin review queue
  const messages = window.storageEngine.getAllMessages();
  const msg = messages.find(m => m.id === newMsg.id);
  if (msg) {
    msg.status = 'pending';
    window.storageEngine.saveAllMessages(messages);
    // Sync pending status to Supabase
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      supabaseClient.from('messages').update({ status: 'pending' }).eq('id', newMsg.id);
    }
  }

  closeBlacklistPopup();

  // Clear draft
  localStorage.removeItem(STORAGE_KEY_DRAFT);
  document.getElementById('draftNotice').style.display = 'none';

  // Show Success Screen
  document.getElementById('kindnessForm').style.display = 'none';
  const successScreen = document.getElementById('submitSuccessScreen');
  successScreen.classList.remove('hidden');
  document.getElementById('submittedPreviewText').textContent = `"${message}" (Submitted for Review)`;

  renderStats();
  if (typeof renderAdminPanel === 'function') renderAdminPanel();
}

/* ==========================================================================
   MODALS: INSPIRE ME, QR CODE, ADMIN
   ========================================================================== */
function openInspireModal() {
  generateRandomInspireMessage();
  document.getElementById('inspireModal').classList.remove('hidden');
}

function generateRandomInspireMessage() {
  const approved = window.storageEngine.getApprovedMessages();
  const box = document.getElementById('inspireContentBox');
  if (!box) return;

  if (approved.length === 0) {
    box.innerHTML = `<p class="inspire-text">"Spread kindness wherever you go."</p>`;
    return;
  }

  const randomMsg = approved[Math.floor(Math.random() * approved.length)];
  box.innerHTML = `
    <p class="inspire-text">“${escapeHTML(randomMsg.message)}”</p>
    <div class="inspire-author">— ${escapeHTML(randomMsg.name || 'Anonymous')} (${randomMsg.relationship})</div>
  `;
}

function copyInspireMessage() {
  const box = document.getElementById('inspireContentBox');
  const text = box.innerText;
  navigator.clipboard.writeText(text);
  showToast('📋 Message copied to clipboard!');
}

function initQRCode() {
  const qrContainer = document.getElementById('qrcode');
  if (!qrContainer) return;
  qrContainer.innerHTML = '';

  const targetUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/board.html#submit');
  document.getElementById('qrTargetUrl').textContent = targetUrl;

  if (window.QRCode) {
    new QRCode(qrContainer, {
      text: targetUrl,
      width: 180,
      height: 180,
      colorDark : "#0284C7",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  }
}

function openQRModal() {
  initQRCode();
  document.getElementById('qrModal').classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function closeModalOnBackdrop(event, modalId) {
  if (event.target.classList.contains('modal-backdrop')) {
    closeModal(modalId);
  }
}

/* ==========================================================================
   ADMIN DASHBOARD LOGIC
   ========================================================================== */
function openAdminModal() {
  document.getElementById('adminModal').classList.remove('hidden');
  renderAdminPanel();
}

function handleAdminLogin(e) {
  e.preventDefault();
  const pass = document.getElementById('adminPass').value;
  if (pass === 'kindness2026') {
    quickDemoLogin();
  } else {
    showToast('⚠️ Incorrect moderator passcode.');
  }
}

function quickDemoLogin() {
  document.getElementById('adminLoginView').classList.add('hidden');
  document.getElementById('adminPanelView').classList.remove('hidden');
  renderAdminPanel();
  showToast('🔓 Logged in to Admin Moderation Dashboard');
}

function adminLogout() {
  document.getElementById('adminPanelView').classList.add('hidden');
  document.getElementById('adminLoginView').classList.remove('hidden');
  showToast('Logged out of Admin Dashboard');
}

function switchAdminTab(tab, tabEl) {
  currentAdminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  renderAdminPanel();
}

function renderAdminPanel() {
  // Guard: skip if admin elements don't exist on this page
  if (!document.getElementById('adminStatPending')) return;

  const stats = window.storageEngine.getStats();

  document.getElementById('adminStatPending').textContent = stats.pendingCount;
  document.getElementById('adminStatApproved').textContent = stats.approvedCount;
  document.getElementById('adminStatRejected').textContent = stats.rejectedCount;
  document.getElementById('pendingCountTab').textContent = stats.pendingCount;

  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  let list = [];
  if (currentAdminTab === 'pending') list = window.storageEngine.getPendingMessages();
  else if (currentAdminTab === 'approved') list = window.storageEngine.getApprovedMessages();
  else if (currentAdminTab === 'rejected') list = window.storageEngine.getRejectedMessages();

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">No ${currentAdminTab} messages found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(m => `
    <tr>
      <td><span class="badge badge-success">${escapeHTML(m.category)}</span></td>
      <td><strong>${escapeHTML(m.name || 'Anonymous')}</strong><br><small style="color: var(--text-muted);">${m.relationship}</small></td>
      <td style="max-width: 320px;">“${escapeHTML(m.message)}”</td>
      <td><small>${m.date}</small></td>
      <td>
        <div class="admin-actions-cell">
          ${currentAdminTab === 'pending' ? `
            <button class="btn-success-sm" onclick="adminApprove('${m.id}')" title="Approve">✓ Approve</button>
            <button class="btn-danger-sm" onclick="adminReject('${m.id}')" title="Reject">✕ Reject</button>
          ` : ''}
          ${currentAdminTab === 'approved' ? `
            <button class="btn-danger-sm" onclick="adminReject('${m.id}')" title="Move to rejected">Unpublish</button>
          ` : ''}
          ${currentAdminTab === 'rejected' ? `
            <button class="btn-success-sm" onclick="adminApprove('${m.id}')" title="Approve">Re-Approve</button>
          ` : ''}
          <button class="btn-link" onclick="adminDelete('${m.id}')" style="color: #EF4444; font-size: 0.8rem; margin-left: 0.3rem;">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function adminApprove(id) {
  window.storageEngine.approveMessage(id);
  renderAdminPanel();
  renderBoard();
  renderStats();
  renderDailyFeatured();
  showToast('✓ Message approved & published to Kindness Board');
}

function adminReject(id) {
  window.storageEngine.rejectMessage(id);
  renderAdminPanel();
  renderBoard();
  renderStats();
  showToast('Message rejected');
}

function adminDelete(id) {
  if (confirm('Are you sure you want to permanently delete this submission?')) {
    window.storageEngine.deleteMessage(id);
    renderAdminPanel();
    renderBoard();
    renderStats();
    showToast('Message permanently deleted');
  }
}

function exportMessagesCSV() {
  window.storageEngine.exportToCSV();
  showToast('📥 CSV Messages report downloaded!');
}

/* ==========================================================================
   NAVIGATION & PRIVACY MODAL & TOAST HELPER
   ========================================================================== */
function setActiveNav(element) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  element.classList.add('active');
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.remove('open');
}

function toggleMobileMenu() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.toggle('open');
}

function openPrivacyModal() {
  document.getElementById('infoModalTitle').textContent = 'Privacy Policy';
  document.getElementById('infoModalBody').innerHTML = `
    <p><strong>Kindness Board Privacy Commitment:</strong></p>
    <p>1. <strong>Anonymity:</strong> You can submit messages completely anonymously without providing a name or email address.</p>
    <p>2. <strong>Data Collection:</strong> If you provide an optional email address, it will only be used for campaign updates or digital participation certificates.</p>
    <p>3. <strong>Moderation:</strong> All submissions undergo student moderation before being made visible on the public Kindness Board to protect patients, caregivers, and contributors.</p>
  `;
  document.getElementById('infoModal').classList.remove('hidden');
}

function openTermsModal() {
  document.getElementById('infoModalTitle').textContent = 'Terms of Use';
  document.getElementById('infoModalBody').innerHTML = `
    <p><strong>Community Guidelines:</strong></p>
    <p>1. All messages must be respectful, uplifting, and free from offensive or inappropriate language.</p>
    <p>2. Submissions intended for medical advice or promotional content will be rejected by moderators.</p>
    <p>3. By submitting a message, you grant permission for it to be displayed digitally and printed in palliative care center booklets.</p>
  `;
  document.getElementById('infoModal').classList.remove('hidden');
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
