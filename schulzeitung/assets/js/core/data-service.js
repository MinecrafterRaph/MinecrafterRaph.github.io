/**
 * Lädt JSON-Dateien und merged LocalStorage-Overrides (Admin/Redaktion).
 */
import { LS_KEYS, readJson, writeJson } from "./storage.js";

const BASE = document.querySelector("html")?.dataset?.base || "";

function assetPath(p) {
  if (!p) return p;
  if (p.startsWith("http")) return p;
  return `${BASE}${p}`.replace(/\/+/g, "/").replace(/^\//, "");
}

async function fetchJson(path) {
  const res = await fetch(assetPath(path));
  if (!res.ok) throw new Error(`Konnte ${path} nicht laden`);
  return res.json();
}

let cache = {
  editions: null,
  articles: null,
  categories: null,
  authors: null,
  ads: null,
};

export async function loadAllData() {
  const [editions, articles, categories, authors, ads] = await Promise.all([
    fetchJson("data/editions.json"),
    fetchJson("data/articles.json"),
    fetchJson("data/categories.json"),
    fetchJson("data/authors.json"),
    fetchJson("data/ads.json"),
  ]);

  const edOverride = readJson(LS_KEYS.EDITIONS_OVERRIDE, null);
  const artOverride = readJson(LS_KEYS.ARTICLES_OVERRIDE, null);
  const adsOverride = readJson(LS_KEYS.ADS_OVERRIDE, null);

  cache.editions = edOverride || editions;
  cache.articles = artOverride || articles;
  cache.categories = categories;
  cache.authors = authors;
  cache.ads = adsOverride || ads;

  return cache;
}

export function getCached() {
  return cache;
}

export function saveArticles(articles) {
  writeJson(LS_KEYS.ARTICLES_OVERRIDE, articles);
  cache.articles = articles;
}

export function saveEditions(editions) {
  writeJson(LS_KEYS.EDITIONS_OVERRIDE, editions);
  cache.editions = editions;
}

export function saveAds(ads) {
  writeJson(LS_KEYS.ADS_OVERRIDE, ads);
  cache.ads = ads;
}

export function getSiteContent() {
  const defaults = {
    heroEyebrow: "Schulzeitung",
    heroTitle: "Stimmen aus dem Schulleben",
    heroSubtitle:
      "Reportagen, Meinungen und Hintergruende aus Unterricht, Projekten, Kultur und Sport - von Schuelerinnen und Schuelern fuer die ganze Schulgemeinschaft.",
    aboutHtml:
      "<p>Unsere Schulzeitung erscheint mehrmals im Jahr und begleitet das Schulleben mit klaren, sorgfaeltig recherchierten Beitraegen.</p><p>Wir berichten ueber Unterricht, Projekte, Sport, Kultur und Themen, die die Schulgemeinschaft bewegen. Mitmachen ist ausdruecklich erwuenscht.</p>",
    contactEmail: "zeitung@schule.example",
    contactPhone: "+49 123 456789",
    contactRoom: "Raum 2.14, Mittwoch 7. Stunde",
    adsEnabled: false,
    theme: "classic",
  };
  return { ...defaults, ...readJson(LS_KEYS.SITE_CONTENT, {}) };
}

export function saveSiteContent(content) {
  writeJson(LS_KEYS.SITE_CONTENT, content);
}

export function categoryById(id) {
  return (cache.categories || []).find((c) => c.id === id);
}

export function authorById(id) {
  return (cache.authors || []).find((a) => a.id === id);
}

export function editionById(id) {
  return (cache.editions || []).find((e) => e.id === String(id));
}

export function publishedArticles() {
  return (cache.articles || []).filter((a) => a.status === "published");
}

export function resolveAssetUrl(path) {
  return assetPath(path);
}
