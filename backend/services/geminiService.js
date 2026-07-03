const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-2.5-flash';

// A key is valid only if it is a real key string (not a placeholder)
const hasValidKey = (
  apiKey.length > 10 &&
  apiKey !== 'your_gemini_api_key_here' &&
  !apiKey.startsWith('your_') &&
  !apiKey.toLowerCase().includes('placeholder')
);

let genAI = null;
if (hasValidKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Service to manage direct communication with Google Gemini API.
 * Zero mock/offline fallbacks — throws explicit errors when unavailable.
 */
class GeminiService {
  /** Returns true only when a real valid API key is present. */
  isConfigured() {
    return hasValidKey;
  }

  /** Returns the model name being used. */
  getModelName() {
    return MODEL_NAME;
  }

  /** Throws a descriptive error if Gemini is not configured. */
  _assertConfigured() {
    if (!hasValidKey) {
      throw new Error(
        'Gemini API key is not configured. Please add a valid GEMINI_API_KEY to your backend .env file. ' +
        'Get a free key at https://aistudio.google.com/app/apikey'
      );
    }
  }

  /**
   * Request structured JSON content from Gemini.
   * @param {string} prompt
   * @param {string} systemInstruction
   * @returns {Promise<object>} parsed JSON object
   */
  async generateStructuredResponse(prompt, systemInstruction = '') {
    this._assertConfigured();

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = result.response.text();

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Gemini returned malformed JSON: ${text.substring(0, 200)}`);
    }
  }

  /**
   * Request natural-language text content from Gemini.
   * @param {string} prompt
   * @param {string} systemInstruction
   * @returns {Promise<string>}
   */
  async generateTextResponse(prompt, systemInstruction = '') {
    this._assertConfigured();

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction,
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Ping Gemini to verify the key is valid and the service is reachable.
   * @returns {Promise<boolean>}
   */
  async ping() {
    if (!hasValidKey) return false;
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 5 },
      });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new GeminiService();
