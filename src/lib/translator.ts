import db from './db';

interface TranslationResult {
  translatedText: string;
}

async function callTranslationAPI(text: string, targetLang: string): Promise<string> {
  // Using MyMemory API for free translation without an API key (suitable for MVP)
  // Limit: 500 words/day (or 50000 with email param)
  const sourceLang = 'ru'; // Assuming source is usually Russian
  if (targetLang === sourceLang) return text;
  
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MyMemory API error: ${res.status}`);
    const data = await res.json();
    
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    throw new Error('Invalid response from translation API');
  } catch (error) {
    console.error('Translation failed:', error);
    return `(Перевод на ${targetLang}) ${text}`;
  }
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || !targetLang) return text;
  
  try {
    // 1. Check Cache
    const cached = await db.translationCache.findUnique({
      where: {
        originalText_targetLang: {
          originalText: text,
          targetLang
        }
      }
    });

    if (cached) {
      return cached.translated;
    }

    // 2. Call External API
    const translated = await callTranslationAPI(text, targetLang);

    // 3. Save to Cache
    await db.translationCache.create({
      data: {
        originalText: text,
        targetLang,
        translated
      }
    });

    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback to mock text if error (or if DB table doesn't exist yet)
    return `(Перевод на ${targetLang}) ${text}`;
  }
}
