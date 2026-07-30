/* ==========================================================================
   AI HELPER & SENTIMENT SERVICE
   Provides AI wording expansion, content safety checks, and auto-categorization.
   ========================================================================== */

const AI_SUGGESTIONS = [
  "Sending you endless warmth, comfort, and peaceful thoughts today. You are held in our hearts.",
  "To the wonderful care team: your selflessness and gentle care illuminate the darkest hours. Thank you!",
  "May quiet hope fill your heart today. Even on difficult days, you are surrounded by care and courage.",
  "Wishing you strength and tranquility. Remember that every small step you take is a triumph.",
  "Sending a warm prayer for your peace and healing. You are never alone on this journey."
];

const OFFENSIVE_KEYWORDS = [
  'hate', 'fool', 'stupid', 'idiot', 'ugly', 'trash', 'kill', 'worst', 'abuse', 'curse'
];

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

  checkContentSafety(text) {
    if (!text) return { isSafe: true, reason: '' };
    const lower = text.toLowerCase();
    for (const word of OFFENSIVE_KEYWORDS) {
      if (lower.includes(word)) {
        return {
          isSafe: false,
          reason: `Please ensure your message remains gentle and supportive. (Detected word: "${word}")`
        };
      }
    }
    return { isSafe: true, reason: 'Message looks respectful and warm!' };
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
    if (lower.includes('strong') || lower.includes('courage') || lower.includes('fight') || lower.includes('brave')) {
      return 'Encouragement';
    }
    return 'Words of Hope';
  }
}

window.aiHelper = new AiHelper();
