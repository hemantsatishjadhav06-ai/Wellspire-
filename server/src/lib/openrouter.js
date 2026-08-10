// OpenRouter client — a thin wrapper over the chat-completions API.
// The API key is read from the environment only (OPENROUTER_API_KEY); it is
// never hard-coded or logged. When no key is set, `configured` is false and
// callers fall back to deterministic local logic.
import config from '../config.js';
import logger from './logger.js';

export const configured = config.openrouter.configured;

/**
 * Call an OpenRouter chat model.
 * @param {Array<{role:string,content:string}>} messages
 * @param {object} [opts] { model, temperature, jsonMode }
 * @returns {Promise<string>} assistant message content
 */
export async function chat(messages, opts = {}) {
  if (!configured) {
    throw new Error('OpenRouter is not configured. Set OPENROUTER_API_KEY.');
  }
  const body = {
    model: opts.model || config.openrouter.model,
    messages,
    temperature: opts.temperature ?? 0.4,
  };
  if (opts.jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(`${config.openrouter.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openrouter.apiKey}`,
      'Content-Type': 'application/json',
      // OpenRouter attribution headers (recommended, not secret)
      'HTTP-Referer': config.appUrl,
      'X-Title': 'Wellspire SMS',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.error(`OpenRouter error ${res.status}`, text.slice(0, 500));
    throw new Error(`OpenRouter request failed (${res.status})`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

/** Convenience: ask for strict JSON and parse it, tolerating code fences. */
export async function chatJSON(messages, opts = {}) {
  const raw = await chat(messages, { ...opts, jsonMode: true });
  return parseJSONLoose(raw);
}

export function parseJSONLoose(raw) {
  if (!raw) return null;
  let text = String(raw).trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const startArr = text.indexOf('[');
    const s = start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
    const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (s !== -1 && end !== -1) {
      try { return JSON.parse(text.slice(s, end + 1)); } catch { /* fall through */ }
    }
    return null;
  }
}

export default { configured, chat, chatJSON, parseJSONLoose };
