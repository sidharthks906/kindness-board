/* ==========================================================================
   AI HELPER, SENTIMENT SERVICE & PROFANITY FILTER ENGINE
   Provides AI wording expansion, content safety checks, auto-categorization,
   and a comprehensive blacklisted word detection system.
   ========================================================================== */

const AI_SUGGESTIONS = [
  "Sending you endless warmth, comfort, and peaceful thoughts today. You are held in our hearts.",
  "To the wonderful care team: your selflessness and gentle care illuminate the darkest hours. Thank you!",
  "May quiet hope fill your heart today. Even on difficult days, you are surrounded by care and courage.",
  "Wishing you strength and tranquility. Remember that every small step you take is a triumph.",
  "Sending a warm prayer for your peace and healing. You are never alone on this journey."
];

// ============================================================================
// COMPREHENSIVE BLACKLIST WORD DATABASE
// Covers profanity, slurs, hate speech, harassment, violent language, etc.
// Words are stored lowercase for case-insensitive matching.
// ============================================================================
const BLACKLISTED_WORDS = [
  // Profanity & Vulgar Language
  'fuck', 'shit', 'ass', 'asshole', 'bitch', 'bastard', 'damn', 'dick',
  'crap', 'piss', 'cock', 'cunt', 'motherfucker', 'bullshit', 'dumbass',
  'wtf', 'stfu', 'lmao', 'fml', 'af',

  // Slurs & Hate Speech
  'nigger', 'nigga', 'retard', 'retarded', 'faggot', 'fag', 'dyke',
  'tranny', 'chink', 'spic', 'kike', 'wetback', 'cracker',
  'coon', 'gook', 'beaner', 'redneck',

  // Insults & Derogatory
  'idiot', 'stupid', 'moron', 'fool', 'dumb', 'loser', 'ugly',
  'freak', 'weirdo', 'psycho', 'trash', 'scum', 'slut', 'whore',
  'skank', 'hoe', 'thot', 'creep', 'pervert', 'disgusting',
  'pathetic', 'worthless', 'useless', 'lame', 'suck', 'sucks',
  'noob', 'dork', 'nerd',

  // Violence & Threats
  'kill', 'murder', 'die', 'death', 'suicide', 'stab', 'shoot',
  'bomb', 'terrorist', 'attack', 'destroy', 'torture', 'rape',
  'abuse', 'assault', 'molest', 'kidnap', 'threat', 'weapon',
  'gun', 'knife', 'blood', 'gore', 'strangle', 'choke',

  // Hate & Negativity
  'hate', 'hatred', 'racist', 'racism', 'sexist', 'sexism',
  'homophobic', 'nazi', 'bigot', 'extremist', 'worst', 'terrible',
  'horrible', 'awful', 'despise', 'curse', 'evil', 'demon',
  'satan', 'hell',

  // Drugs & Illegal
  'drugs', 'weed', 'cocaine', 'heroin', 'meth', 'crack',
  'marijuana', 'overdose',

  // Inappropriate/Sexual Content
  'porn', 'sex', 'nude', 'naked', 'xxx', 'boob', 'penis',
  'vagina', 'orgasm', 'horny', 'erotic', 'fetish', 'kinky',

  // Spam / Scam Indicators
  'scam', 'fraud', 'hack', 'phishing', 'clickbait'
];

// ============================================================================
// PROFANITY FILTER ENGINE CLASS
// Detects blacklisted words with smart boundary matching to avoid false
// positives (e.g. "class" should not trigger "ass").
// ============================================================================
class ProfanityFilter {
  constructor(wordList) {
    this.blacklist = wordList.map(w => w.toLowerCase().trim());
    // Build regex patterns with word boundaries for accurate matching
    this.patterns = this.blacklist.map(word => ({
      word: word,
      regex: new RegExp(`\\b${this._escapeRegex(word)}\\b`, 'gi')
    }));
  }

  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Scans text for blacklisted words.
   * @param {string} text - The text to scan.
   * @returns {{ isClean: boolean, detectedWords: string[] }}
   */
  scan(text) {
    if (!text || typeof text !== 'string') {
      return { isClean: true, detectedWords: [] };
    }

    const detected = [];
    const lowerText = text.toLowerCase();

    for (const { word, regex } of this.patterns) {
      // Reset regex lastIndex for global patterns
      regex.lastIndex = 0;
      if (regex.test(lowerText)) {
        if (!detected.includes(word)) {
          detected.push(word);
        }
      }
    }

    return {
      isClean: detected.length === 0,
      detectedWords: detected
    };
  }

  /**
   * Returns a censored version of the text (for display purposes).
   * e.g. "fuck" => "f***"
   */
  censor(text) {
    if (!text) return text;
    let censored = text;
    for (const { regex, word } of this.patterns) {
      regex.lastIndex = 0;
      censored = censored.replace(regex, word[0] + '*'.repeat(word.length - 1));
    }
    return censored;
  }
}

// Create global profanity filter instance
const profanityFilter = new ProfanityFilter(BLACKLISTED_WORDS);

// ============================================================================
// BLACKLIST VIOLATION POPUP MODAL
// Shows a styled popup when the user tries to submit a message containing
// blacklisted words, listing exactly which words triggered the block.
// ============================================================================
function showBlacklistPopup(detectedWords) {
  // Remove any existing popup first
  const existing = document.getElementById('blacklistPopupOverlay');
  if (existing) existing.remove();

  const wordBadges = detectedWords.map(w =>
    `<span class="blacklist-word-badge">${w[0]}${'*'.repeat(w.length - 1)}</span>`
  ).join(' ');

  const overlay = document.createElement('div');
  overlay.id = 'blacklistPopupOverlay';
  overlay.className = 'blacklist-popup-overlay';

  overlay.innerHTML = `
    <div class="blacklist-popup-card">
      <div class="blacklist-popup-icon">🚫</div>
      <h3 class="blacklist-popup-title">Submission Blocked</h3>
      <p class="blacklist-popup-desc">
        Your message could not be submitted because it contains <strong>${detectedWords.length} blacklisted word${detectedWords.length > 1 ? 's' : ''}</strong> that violate our community guidelines.
      </p>
      <div class="blacklist-words-container">
        <p class="blacklist-words-label">Detected words:</p>
        <div class="blacklist-words-list">
          ${wordBadges}
        </div>
      </div>
      <p class="blacklist-popup-hint">
        Please revise your message to be kind, respectful, and supportive. If you believe this is a mistake, you can submit it for manual review.
      </p>
      <div style="display: flex; gap: 1rem; margin-top: 1rem;">
        <button class="btn btn-primary blacklist-popup-btn" style="flex: 1;" onclick="closeBlacklistPopup()">
          ✏️ Check Again
        </button>
        <button class="btn btn-secondary blacklist-popup-btn" style="flex: 1;" onclick="submitForReview()">
          Submit for Review
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBlacklistPopup();
  });

  // Close on Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeBlacklistPopup();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function closeBlacklistPopup() {
  const overlay = document.getElementById('blacklistPopupOverlay');
  if (overlay) {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
  }
}


// ============================================================================
// AI HELPER CLASS (with integrated profanity filter)
// ============================================================================
class AiHelper {
  getRandomSuggestion() {
    const idx = Math.floor(Math.random() * AI_SUGGESTIONS.length);
    return AI_SUGGESTIONS[idx];
  }

  expandWording(userInput) {
    if (!userInput || userInput.trim().length < 3) {
      return this.getRandomSuggestion();
    }
    const text = userInput.trim();
    if (text.toLowerCase().includes('get well') || text.toLowerCase().includes('heal')) {
      return `Wishing you peace and comforting rest today. May strength wrap around you as you heal: "${text}"`;
    }
    if (text.toLowerCase().includes('thank') || text.toLowerCase().includes('care')) {
      return `With deepest gratitude for your tireless care and compassionate heart: "${text}"`;
    }
    return `Sending you warm encouragement and quiet hope: "${text}. You are in our thoughts!"`;
  }

  /**
   * Checks content safety using the profanity filter engine.
   * Returns { isSafe, reason, detectedWords }
   */
  checkContentSafety(text) {
    if (!text) return { isSafe: true, reason: '', detectedWords: [] };

    const result = profanityFilter.scan(text);

    if (!result.isClean) {
      return {
        isSafe: false,
        reason: `Blacklisted word${result.detectedWords.length > 1 ? 's' : ''} detected: "${result.detectedWords.join('", "')}"`,
        detectedWords: result.detectedWords
      };
    }

    return { isSafe: true, reason: 'Message looks respectful and warm!', detectedWords: [] };
  }

  detectCategory(text) {
    if (!text) return 'Words of Hope';
    const lower = text.toLowerCase();
    
    if (lower.includes('pray') || lower.includes('bless') || lower.includes('god') || lower.includes('peace')) {
      return 'Prayer';
    }
    if (lower.includes('nurse') || lower.includes('doctor') || lower.includes('caregiver') || lower.includes('staff')) {
      return 'Thank You Caregiver';
    }
    if (lower.includes('thank') || lower.includes('appreciation') || lower.includes('grateful')) {
      return 'Gratitude';
    }
    if (lower.includes('quote') || lower.includes('"') || lower.includes('—')) {
      return 'Inspirational Quote';
    }
    if (lower.includes('strong') || lower.includes('courage') || lower.includes('brave')) {
      return 'Encouragement';
    }
    return 'Words of Hope';
  }
}

window.aiHelper = new AiHelper();
