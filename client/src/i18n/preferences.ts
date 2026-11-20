import { ES, ES_PATTERNS } from './es';

// Language and theme are per-browser preferences, saved in localStorage.
export type Lang = 'en' | 'es';
export type Theme = 'light' | 'dark';
const LANG_KEY = 'cn.lang';
const THEME_KEY = 'cn.theme';

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private mode or blocked storage: fall back to the defaults
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* not saved; the choice still applies until reload */
  }
};

export const currentLang = (): Lang => (read(LANG_KEY) === 'es' ? 'es' : 'en');
export const currentTheme = (): Theme => {
  const saved = read(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  write(THEME_KEY, theme);
}

/** Spanish for one English text, or null when the dictionary has no entry. */
export function toSpanish(text: string): string | null {
  const key = text.trim();
  if (!key) return null;
  const hit = ES[key] ?? ES_PATTERNS.find(([re]) => re.test(key)) ?? null;
  if (hit === null) return null;
  const es = typeof hit === 'string' ? hit : key.replace(hit[0], hit[1] as string); // a function replacer works too
  return text.replace(key, es); // keep the surrounding spaces React rendered
}

/*
 * Translation layer: the components render English; while Spanish is on, a MutationObserver
 * swaps each rendered text and label for its dictionary entry and remembers the English one,
 * so switching back restores it. React keeps working because it only rewrites a text node when
 * its English value changes, and the observer translates that new value again.
 */
const ATTRS = ['placeholder', 'aria-label', 'title'];
const originalText = new WeakMap<Text, string>();
const originalAttr = new WeakMap<Element, Record<string, string>>();
let observer: MutationObserver | null = null;

function translateText(node: Text) {
  const value = node.nodeValue ?? '';
  const es = toSpanish(value);
  if (es !== null && es !== value) {
    originalText.set(node, value);
    node.nodeValue = es;
  }
}
function translateAttrs(el: Element) {
  for (const name of ATTRS) {
    const value = el.getAttribute(name);
    const es = value === null ? null : toSpanish(value);
    if (value !== null && es !== null && es !== value) {
      originalAttr.set(el, { ...originalAttr.get(el), [name]: value });
      el.setAttribute(name, es);
    }
  }
}
function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (el.closest('script, style, textarea, [data-no-translate]')) return;
  translateAttrs(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n as Text);
    else translateAttrs(n as Element);
  }
}
function restoreTree(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n: Node | null = root; n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) {
      const en = originalText.get(n as Text);
      if (en !== undefined) n.nodeValue = en;
    } else {
      const attrs = originalAttr.get(n as Element);
      if (attrs) for (const [name, en] of Object.entries(attrs)) (n as Element).setAttribute(name, en);
    }
  }
}

export function setLang(lang: Lang) {
  write(LANG_KEY, lang);
  document.documentElement.lang = lang;
  observer?.disconnect();
  observer = null;
  if (lang === 'en') return restoreTree(document.body);
  translateTree(document.body);
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') translateText(m.target as Text);
      else if (m.type === 'attributes') translateAttrs(m.target as Element);
      else m.addedNodes.forEach(translateTree);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
