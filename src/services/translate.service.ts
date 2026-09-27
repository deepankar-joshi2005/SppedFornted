// Translation Service for Speed Education
// Uses Google Translate API with in-memory caching and pre-fetching support.

const translationCache = new Map<string, string>();

/**
 * Check if string contains Devanagari (Hindi) characters
 */
export const hasDevanagari = (str: string): boolean => {
  if (!str) return false;
  return /[\u0900-\u097F]/.test(str);
};

/**
 * Translate a single block of text between English and Hindi
 */
export const translateText = async (
  text: string,
  fromLang: 'en' | 'hi',
  toLang: 'en' | 'hi'
): Promise<string> => {
  if (!text || !text.trim() || fromLang === toLang) {
    return text;
  }

  const trimmed = text.trim();

  // If asking for Hindi translation but text is already Hindi, return as is
  if (toLang === 'hi' && hasDevanagari(trimmed)) {
    return text;
  }

  // If asking for English translation but text is already English, return as is
  if (toLang === 'en' && !hasDevanagari(trimmed)) {
    return text;
  }

  const cacheKey = `${fromLang}:${toLang}:${trimmed}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(
      trimmed
    )}`;
    const response = await fetch(url);
    if (!response.ok) {
      return text;
    }
    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: any) => (item && item[0] ? item[0] : '')).join('');
      if (translated) {
        translationCache.set(cacheKey, translated);
        return translated;
      }
    }
  } catch (err) {
    // If network fails, return original text safely
  }

  return text;
};

/**
 * Translate an array of texts in parallel
 */
export const translateBatch = async (
  texts: string[],
  fromLang: 'en' | 'hi',
  toLang: 'en' | 'hi'
): Promise<string[]> => {
  if (!texts || !texts.length) return texts;
  return Promise.all(texts.map((t) => translateText(t, fromLang, toLang)));
};

export interface QuestionData {
  id: string;
  text: string;
  textHindi?: string | null;
  options: string[];
  optionsHindi?: string[] | null;
  explanation?: string;
  explanationHindi?: string | null;
}

export interface TranslatedQuestionResult {
  text: string;
  options: string[];
  explanation?: string;
  isAutoTranslated?: boolean;
}

/**
 * Synchronously check if a translated question is available (native or cached)
 */
export const getQuestionForLanguageSync = (
  q: QuestionData,
  targetLang: 'English' | 'Hindi'
): TranslatedQuestionResult | null => {
  if (!q) return null;

  if (targetLang === 'Hindi') {
    const hasNativeHindiText = !!(q.textHindi && q.textHindi.trim());
    const hasNativeHindiOptions = !!(
      q.optionsHindi &&
      q.optionsHindi.length === 4 &&
      q.optionsHindi.every((o) => o && o.trim())
    );

    const nativeText = hasNativeHindiText ? q.textHindi! : q.text && hasDevanagari(q.text) ? q.text : null;
    const nativeOptions = hasNativeHindiOptions
      ? q.optionsHindi!
      : q.options && q.options.every((o) => hasDevanagari(o))
      ? q.options
      : null;

    // Check cache if native not available
    const cachedText = nativeText || translationCache.get(`en:hi:${q.text?.trim()}`);
    const cachedOptions = nativeOptions || q.options.map((opt) => translationCache.get(`en:hi:${opt.trim()}`) || opt);

    const allOptionsCached = nativeOptions || q.options.every((opt) => translationCache.has(`en:hi:${opt.trim()}`));

    if (cachedText && allOptionsCached) {
      return {
        text: cachedText,
        options: cachedOptions,
        explanation: q.explanationHindi || translationCache.get(`en:hi:${q.explanation?.trim()}`) || q.explanation,
        isAutoTranslated: !hasNativeHindiText || !hasNativeHindiOptions,
      };
    }

    if (nativeText && nativeOptions) {
      return {
        text: nativeText,
        options: nativeOptions,
        explanation: q.explanationHindi || q.explanation,
        isAutoTranslated: false,
      };
    }

    return null;
  } else {
    // English target
    const hasNativeEngText = !!(q.text && q.text.trim() && !hasDevanagari(q.text));
    const hasNativeEngOptions = !!(
      q.options &&
      q.options.length === 4 &&
      q.options.every((o) => o && !hasDevanagari(o))
    );

    const nativeText = hasNativeEngText ? q.text : null;
    const nativeOptions = hasNativeEngOptions ? q.options : null;

    const sourceText = q.textHindi || q.text;
    const sourceOptions = q.optionsHindi && q.optionsHindi.length === 4 ? q.optionsHindi : q.options;

    const cachedText = nativeText || translationCache.get(`hi:en:${sourceText?.trim()}`);
    const cachedOptions = nativeOptions || sourceOptions.map((opt) => translationCache.get(`hi:en:${opt.trim()}`) || opt);

    const allOptionsCached = nativeOptions || sourceOptions.every((opt) => translationCache.has(`hi:en:${opt.trim()}`));

    if (cachedText && allOptionsCached) {
      return {
        text: cachedText,
        options: cachedOptions,
        explanation: q.explanation || translationCache.get(`hi:en:${q.explanationHindi?.trim()}`) || q.explanationHindi || undefined,
        isAutoTranslated: !hasNativeEngText || !hasNativeEngOptions,
      };
    }

    if (nativeText && nativeOptions) {
      return {
        text: nativeText,
        options: nativeOptions,
        explanation: q.explanation || q.explanationHindi || undefined,
        isAutoTranslated: false,
      };
    }

    return null;
  }
};

/**
 * Async resolution for translated question data with auto-fallback
 */
export const getQuestionForLanguageAsync = async (
  q: QuestionData,
  targetLang: 'English' | 'Hindi'
): Promise<TranslatedQuestionResult> => {
  const syncResult = getQuestionForLanguageSync(q, targetLang);
  if (syncResult) return syncResult;

  if (targetLang === 'Hindi') {
    const textToTranslate = q.text || q.textHindi || '';
    const optionsToTranslate = q.options && q.options.length === 4 ? q.options : q.optionsHindi || [];
    const explanationToTranslate = q.explanation || q.explanationHindi || '';

    const fromLang = hasDevanagari(textToTranslate) ? 'hi' : 'en';

    const [translatedText, translatedOptions, translatedExplanation] = await Promise.all([
      q.textHindi && q.textHindi.trim()
        ? Promise.resolve(q.textHindi)
        : translateText(textToTranslate, fromLang, 'hi'),
      q.optionsHindi && q.optionsHindi.length === 4 && q.optionsHindi.every((o) => o && o.trim())
        ? Promise.resolve(q.optionsHindi)
        : translateBatch(optionsToTranslate, fromLang, 'hi'),
      q.explanationHindi && q.explanationHindi.trim()
        ? Promise.resolve(q.explanationHindi)
        : translateText(explanationToTranslate, fromLang, 'hi'),
    ]);

    return {
      text: translatedText || q.text,
      options: translatedOptions && translatedOptions.length === 4 ? translatedOptions : q.options,
      explanation: translatedExplanation || q.explanation,
      isAutoTranslated: true,
    };
  } else {
    // Target is English
    const textToTranslate = q.text && !hasDevanagari(q.text) ? q.text : q.textHindi || q.text || '';
    const optionsToTranslate =
      q.options && q.options.length === 4 && q.options.every((o) => !hasDevanagari(o))
        ? q.options
        : q.optionsHindi && q.optionsHindi.length === 4
        ? q.optionsHindi
        : q.options;
    const explanationToTranslate =
      q.explanation && !hasDevanagari(q.explanation) ? q.explanation : q.explanationHindi || q.explanation || '';

    const fromLang = 'hi';

    const [translatedText, translatedOptions, translatedExplanation] = await Promise.all([
      q.text && !hasDevanagari(q.text) ? Promise.resolve(q.text) : translateText(textToTranslate, fromLang, 'en'),
      q.options && q.options.length === 4 && q.options.every((o) => !hasDevanagari(o))
        ? Promise.resolve(q.options)
        : translateBatch(optionsToTranslate, fromLang, 'en'),
      q.explanation && !hasDevanagari(q.explanation)
        ? Promise.resolve(q.explanation)
        : translateText(explanationToTranslate, fromLang, 'en'),
    ]);

    return {
      text: translatedText || q.text,
      options: translatedOptions && translatedOptions.length === 4 ? translatedOptions : q.options,
      explanation: translatedExplanation || q.explanation,
      isAutoTranslated: true,
    };
  }
};

/**
 * Preload translations in background for smooth, instant question switching
 */
export const preloadQuestionTranslations = (
  questions: QuestionData[],
  targetLang: 'English' | 'Hindi'
): void => {
  if (!questions || !questions.length) return;
  // Process in background sequentially or small chunks to prevent API flooding
  (async () => {
    for (const q of questions) {
      try {
        await getQuestionForLanguageAsync(q, targetLang);
      } catch (err) {
        // Ignore background preload errors
      }
    }
  })();
};
