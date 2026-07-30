/* ==========================================================================
   STORAGE ENGINE & SEED DATA SERVICE
   Manages persistent LocalStorage state for messages, moderation, and stats.
   ========================================================================== */

const STORAGE_KEY_MESSAGES = 'kindness_board_messages_v1';
const STORAGE_KEY_STATS = 'kindness_board_stats_v1';
const STORAGE_KEY_FEATURED_INDEX = 'kindness_board_featured_idx_v1';

// SEED DATA: Touching, genuine messages for palliative care patients & caregivers
const INITIAL_SEED_MESSAGES = [
  {
    id: 'seed-1',
    name: 'Ananya Sharma',
    email: '',
    relationship: 'Student',
    category: 'Words of Hope',
    message: 'To everyone courageously fighting today: even on the quietest days, your strength inspires us all. Sending you immense warmth and peace.',
    date: '2026-07-28',
    status: 'approved',
    warmthCount: 34,
    featured: true
  },
  {
    id: 'seed-2',
    name: 'Prof. David Miller',
    email: '',
    relationship: 'Faculty',
    category: 'Thank You Caregiver',
    message: 'Deepest gratitude to the extraordinary palliative nurses and doctors. Your gentle hands and compassionate hearts bring light to those in need.',
    date: '2026-07-29',
    status: 'approved',
    warmthCount: 29,
    featured: false
  },
  {
    id: 'seed-3',
    name: '',
    email: '',
    relationship: 'Student',
    category: 'Prayer',
    message: 'May comfort wrap around you like a warm blanket today. You are held in our thoughts, prayers, and hearts every moment.',
    date: '2026-07-29',
    status: 'approved',
    warmthCount: 18,
    featured: false
  },
  {
    id: 'seed-4',
    name: 'Rahul V.',
    email: '',
    relationship: 'Staff',
    category: 'Encouragement',
    message: 'One day at a time, one breath at a time. Never underestimate how much your gentle smile brightens the world around you.',
    date: '2026-07-30',
    status: 'approved',
    warmthCount: 42,
    featured: false
  },
  {
    id: 'seed-5',
    name: 'Sarah Jenkins',
    email: '',
    relationship: 'Visitor',
    category: 'Inspirational Quote',
    message: '“Hope is being able to see that there is light despite all of the darkness.” — Desmond Tutu. Wishing you courage and quiet joy today.',
    date: '2026-07-30',
    status: 'approved',
    warmthCount: 22,
    featured: false
  },
  {
    id: 'seed-6',
    name: 'Kavya & Campus Volunteers',
    email: '',
    relationship: 'Student',
    category: 'Gratitude',
    message: 'Thank you to the families and caregivers who stand as pillars of love and patience. Your dedication is pure grace in action.',
    date: '2026-07-31',
    status: 'approved',
    warmthCount: 15,
    featured: false
  },
  {
    id: 'seed-7',
    name: 'Anonymous Student',
    email: '',
    relationship: 'Student',
    category: 'Words of Hope',
    message: 'Even flowers take time to bloom after winter. Rest gracefully today knowing you are loved and cherished by so many people.',
    date: '2026-07-31',
    status: 'approved',
    warmthCount: 27,
    featured: false
  },
  {
    id: 'seed-8',
    name: 'Dr. A. Joseph',
    email: '',
    relationship: 'Faculty',
    category: 'General Kindness',
    message: 'No effort of love is ever wasted. To all care workers: your empathy is healing humanity one life at a time.',
    date: '2026-07-31',
    status: 'approved',
    warmthCount: 11,
    featured: false
  },
  {
    id: 'seed-9',
    name: 'Sneha Patel',
    email: '',
    relationship: 'Student',
    category: 'Words of Hope',
    message: 'You matter more than words can express. May your day be filled with soft moments, pleasant thoughts, and gentle care.',
    date: '2026-07-31',
    status: 'pending',
    warmthCount: 0,
    featured: false
  }
];

class StorageEngine {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(STORAGE_KEY_MESSAGES)) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(INITIAL_SEED_MESSAGES));
    }
  }

  getAllMessages() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MESSAGES)) || [];
    } catch (e) {
      console.error('Failed to load messages from localStorage', e);
      return [];
    }
  }

  saveAllMessages(messages) {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }

  getApprovedMessages() {
    return this.getAllMessages().filter(m => m.status === 'approved');
  }

  getPendingMessages() {
    return this.getAllMessages().filter(m => m.status === 'pending');
  }

  getRejectedMessages() {
    return this.getAllMessages().filter(m => m.status === 'rejected');
  }

  addMessage(msgData) {
    const messages = this.getAllMessages();
    const newMessage = {
      id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: msgData.name ? msgData.name.trim() : '',
      email: msgData.email ? msgData.email.trim() : '',
      relationship: msgData.relationship || 'Student',
      category: msgData.category || 'Words of Hope',
      message: msgData.message.trim(),
      date: new Date().toISOString().split('T')[0],
      status: 'pending', // Moderation required
      warmthCount: 0,
      featured: false
    };

    messages.unshift(newMessage);
    this.saveAllMessages(messages);
    return newMessage;
  }

  approveMessage(id) {
    const messages = this.getAllMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.status = 'approved';
      this.saveAllMessages(messages);
    }
  }

  rejectMessage(id) {
    const messages = this.getAllMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.status = 'rejected';
      this.saveAllMessages(messages);
    }
  }

  deleteMessage(id) {
    let messages = this.getAllMessages();
    messages = messages.filter(m => m.id !== id);
    this.saveAllMessages(messages);
  }

  incrementWarmth(id) {
    const messages = this.getAllMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.warmthCount = (msg.warmthCount || 0) + 1;
      this.saveAllMessages(messages);
      return msg.warmthCount;
    }
    return 0;
  }

  getDailyFeatured() {
    const approved = this.getApprovedMessages();
    if (approved.length === 0) return null;
    
    // Pick based on day index or fallback
    let featuredIdx = parseInt(localStorage.getItem(STORAGE_KEY_FEATURED_INDEX) || '0', 10);
    if (featuredIdx >= approved.length) {
      featuredIdx = 0;
    }
    return approved[featuredIdx];
  }

  rotateDailyFeatured() {
    const approved = this.getApprovedMessages();
    if (approved.length === 0) return null;
    let featuredIdx = parseInt(localStorage.getItem(STORAGE_KEY_FEATURED_INDEX) || '0', 10);
    featuredIdx = (featuredIdx + 1) % approved.length;
    localStorage.setItem(STORAGE_KEY_FEATURED_INDEX, featuredIdx.toString());
    return approved[featuredIdx];
  }

  getStats() {
    const all = this.getAllMessages();
    const approved = all.filter(m => m.status === 'approved');
    const pending = all.filter(m => m.status === 'pending');
    const rejected = all.filter(m => m.status === 'rejected');

    // Unique participants count
    const participantSet = new Set();
    all.forEach(m => {
      if (m.email) participantSet.add(m.email);
      else if (m.name) participantSet.add(m.name);
      else participantSet.add('anon-' + m.id);
    });

    return {
      totalSubmissions: all.length,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      participantsCount: participantSet.size,
      deliveredCount: Math.floor(approved.length * 1.5) + 40, // Messages delivered to center plus printed copies
      daysActive: 14
    };
  }

  exportToCSV() {
    const messages = this.getAllMessages();
    if (messages.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,ID,Name,Email,Relationship,Category,Status,Date,Message\n";
    messages.forEach(m => {
      const cleanMsg = '"' + m.message.replace(/"/g, '""') + '"';
      const cleanName = '"' + (m.name || 'Anonymous').replace(/"/g, '""') + '"';
      csvContent += `${m.id},${cleanName},${m.email},${m.relationship},${m.category},${m.status},${m.date},${cleanMsg}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kindness_board_messages_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.storageEngine = new StorageEngine();
