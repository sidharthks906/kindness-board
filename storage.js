/* ==========================================================================
   STORAGE ENGINE & SUPABASE / LOCALSTORAGE HYBRID SERVICE
   Manages persistent state for messages, moderation, and stats.
   Supports seamless Supabase sync with automatic LocalStorage fallback.
   ========================================================================== */

const STORAGE_KEY_MESSAGES = 'kindness_board_messages_v1';
const STORAGE_KEY_STATS = 'kindness_board_stats_v1';
const STORAGE_KEY_FEATURED_INDEX = 'kindness_board_featured_idx_v1';

class StorageEngine {
  constructor() {
    this.initStorage();
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      this.syncFromSupabase();
    }
  }

  initStorage() {
    // Start fresh with empty messages if no data exists
    if (!localStorage.getItem(STORAGE_KEY_MESSAGES)) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify([]));
    }
  }

  async syncFromSupabase() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages from Supabase:', error);
        return;
      }

      if (data) {
        const mappedMessages = data.map(m => ({
          id: m.id,
          name: m.name || '',
          email: m.email || '',
          relationship: m.relationship || 'Student',
          category: m.category || 'Words of Hope',
          message: m.message,
          date: m.date,
          status: m.status,
          warmthCount: m.warmth_count || 0,
          featured: m.featured || false
        }));

        this.saveAllMessages(mappedMessages);

        // Re-render UI components if they exist
        if (typeof renderBoard === 'function') renderBoard();
        if (typeof renderStats === 'function') renderStats();
        if (typeof renderDailyFeatured === 'function') renderDailyFeatured();
        if (typeof renderAdminPanel === 'function') renderAdminPanel();
      }
    } catch (e) {
      console.error('Supabase sync exception:', e);
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
      status: 'approved', // Auto-approved — visible immediately on the board
      warmthCount: 0,
      featured: false
    };

    messages.unshift(newMessage);
    this.saveAllMessages(messages);

    // Sync to Supabase in background if enabled
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      supabaseClient.from('messages').insert([{
        id: newMessage.id,
        name: newMessage.name,
        email: newMessage.email,
        relationship: newMessage.relationship,
        category: newMessage.category,
        message: newMessage.message,
        date: newMessage.date,
        status: newMessage.status,
        warmth_count: newMessage.warmthCount,
        featured: newMessage.featured
      }]).then(({ error }) => {
        if (error) console.error('Supabase insert error:', error);
      });
    }

    return newMessage;
  }

  approveMessage(id) {
    const messages = this.getAllMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.status = 'approved';
      this.saveAllMessages(messages);

      if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('messages').update({ status: 'approved' }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase approve error:', error);
        });
      }
    }
  }

  rejectMessage(id) {
    const messages = this.getAllMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.status = 'rejected';
      this.saveAllMessages(messages);

      if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('messages').update({ status: 'rejected' }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase reject error:', error);
        });
      }
    }
  }

  deleteMessage(id) {
    let messages = this.getAllMessages();
    messages = messages.filter(m => m.id !== id);
    this.saveAllMessages(messages);

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      supabaseClient.from('messages').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase delete error:', error);
      });
    }
  }

  incrementWarmth(id) {
    const messages = this.getAllMessages();
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.warmthCount = (msg.warmthCount || 0) + 1;
      this.saveAllMessages(messages);

      if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient.from('messages').update({ warmth_count: msg.warmthCount }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase warmth update error:', error);
        });
      }

      return msg.warmthCount;
    }
    return 0;
  }

  getDailyFeatured() {
    const approved = this.getApprovedMessages();
    if (approved.length === 0) return null;
    
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
      deliveredCount: approved.length,
      daysActive: all.length > 0 ? 1 : 0
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
