const KEYS = {
  API_KEY: "openai_api_key",
  DEFAULT_TEMPERAMENT: "default_temperament",
  DEFAULT_CALL_TYPE: "default_call_type",
  DEFAULT_INPUT_MODE: "default_input_mode",
};

export function getApiKey(): string | null {
  return localStorage.getItem(KEYS.API_KEY);
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEYS.API_KEY, key);
}

export function getDefaultTemperament(): number {
  const stored = localStorage.getItem(KEYS.DEFAULT_TEMPERAMENT);
  return stored ? parseInt(stored, 10) : 2;
}

export function setDefaultTemperament(level: number): void {
  localStorage.setItem(KEYS.DEFAULT_TEMPERAMENT, level.toString());
}

export function getDefaultCallType(): "cold" | "discovery" {
  const stored = localStorage.getItem(KEYS.DEFAULT_CALL_TYPE);
  return stored === "discovery" ? "discovery" : "cold";
}

export function setDefaultCallType(type: "cold" | "discovery"): void {
  localStorage.setItem(KEYS.DEFAULT_CALL_TYPE, type);
}

export function getDefaultInputMode(): "voice" | "text" {
  const stored = localStorage.getItem(KEYS.DEFAULT_INPUT_MODE);
  return stored === "text" ? "text" : "voice";
}

export function setDefaultInputMode(mode: "voice" | "text"): void {
  localStorage.setItem(KEYS.DEFAULT_INPUT_MODE, mode);
}
