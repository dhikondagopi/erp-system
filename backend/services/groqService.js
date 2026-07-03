const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY || '';
const MODEL_NAME = 'llama-3.3-70b-versatile';

const hasValidKey = apiKey.length > 10 && apiKey.startsWith('gsk_');

let groq = null;
if (hasValidKey) {
  groq = new Groq({ apiKey });
}

class GroqService {
  isConfigured() { return hasValidKey; }
  getModelName() { return MODEL_NAME; }

  _assertConfigured() {
    if (!hasValidKey) {
      throw new Error(
        'GROQ_API_KEY is not configured. Get a free key at https://console.groq.com/keys ' +
        '(no credit card required). Add it to backend/.env as GROQ_API_KEY=gsk_...'
      );
    }
  }

  async generateStructuredResponse(prompt, systemInstruction = '') {
    this._assertConfigured();

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction + '\nIMPORTANT: Return ONLY valid JSON. No markdown code blocks. No extra text.' });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const completion = await groq.chat.completions.create({
        model: MODEL_NAME,
        messages,
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });

      const text = completion.choices[0]?.message?.content || '';
      return JSON.parse(text);
    } catch (err) {
      const geminiService = require('./geminiService');
      if (geminiService.isConfigured()) {
        console.warn(`[GroqService] Request failed, falling back to Gemini: ${err.message}`);
        try {
          return await geminiService.generateStructuredResponse(prompt, systemInstruction);
        } catch (geminiErr) {
          console.error(`[GroqService] Gemini fallback also failed: ${geminiErr.message}`);
          throw geminiErr;
        }
      }
      throw err;
    }
  }

  async generateTextResponse(prompt, systemInstruction = '') {
    this._assertConfigured();

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const completion = await groq.chat.completions.create({
        model: MODEL_NAME,
        messages,
        temperature: 0.3,
        max_tokens: 2048,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (err) {
      const geminiService = require('./geminiService');
      if (geminiService.isConfigured()) {
        console.warn(`[GroqService] Request failed, falling back to Gemini: ${err.message}`);
        try {
          return await geminiService.generateTextResponse(prompt, systemInstruction);
        } catch (geminiErr) {
          console.error(`[GroqService] Gemini fallback also failed: ${geminiErr.message}`);
          throw geminiErr;
        }
      }
      throw err;
    }
  }

  async ping() {
    if (!hasValidKey) return false;
    try {
      await groq.chat.completions.create({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new GroqService();
