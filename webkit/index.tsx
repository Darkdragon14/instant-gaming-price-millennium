import { STYLES } from './styles';
import { OFFICIAL_LOGO_URL } from './logo';

type InstantGamingOffer = {
  name: string;
  url: string;
  price: number;
  current_price: string;
  discount: number;
  in_stock: boolean;
  buy_label: string;
  product_id?: number;
};

type InstantGamingApiResponse = {
  success?: boolean;
  name?: string;
  url?: string;
  price?: string | number;
  cur_price?: string;
  discount?: string | number;
  in_stock?: boolean;
  buy?: string;
  prod_id?: string | number;
};

const CARD_ID = 'millennium-instant-gaming-price';
const STYLE_ID = 'millennium-instant-gaming-price-styles';
const APP_URL = /\/app\/(\d+)/;
const WISHLIST_URL = /\/wishlist\//;
const WISHLIST_ITEM = '[data-rfd-draggable-id^="WishlistItem-"]';
const WISHLIST_ROW_CLASS = 'migp-wishlist-row';

let lastLookupKey = '';
let requestGeneration = 0;
let retryAfter = 0;
let lastDiagnostic = '';
let observer: MutationObserver | undefined;
let routeTimer: number | undefined;
const offerCache = new Map<string, { expires: number; offer: InstantGamingOffer | null }>();

function decodeEntities(value: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function text(selector: string): string {
  return document.querySelector<HTMLElement>(selector)?.textContent?.trim() ?? '';
}

function createOfficialLogo(): HTMLImageElement {
  const image = document.createElement('img');
  image.className = 'migp-logo';
  image.src = OFFICIAL_LOGO_URL;
  image.alt = 'Instant Gaming';
  return image;
}

function safeOfferUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && url.hostname === 'www.instant-gaming.com' ? url.toString() : null;
  } catch {
    return null;
  }
}

function systemBrowserUrl(raw: string): string | null {
  const safeUrl = safeOfferUrl(raw);
  return safeUrl ? `steam://openurl_external/${safeUrl}` : null;
}

async function fetchOffer(
  appId: string,
  gameName: string,
  editionId: string,
  language: string,
): Promise<InstantGamingOffer | null> {
  const cacheKey = [appId, gameName, editionId, language].join('|');
  const cached = offerCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.offer;

  const query = new URLSearchParams({
    process: 'find_game',
    steamappid: appId,
    name: gameName,
    region: '',
    platform: 'pc',
    type: 'steam',
    find_steam_appid: '',
    find_by_name: '',
    isolang: language,
    medium: 'millennium',
    campaign: 'steam-client',
    editionId,
  });
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`https://www.instant-gaming.com/ext_api/?${query}`, {
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      offerCache.set(cacheKey, { expires: Date.now() + 5 * 60_000, offer: null });
      return null;
    }
    const payload = await response.json() as InstantGamingApiResponse;
    const price = Number(payload.price);
    const discount = Number(payload.discount);
    if (
      payload.success !== true
      || typeof payload.name !== 'string'
      || typeof payload.url !== 'string'
      || !safeOfferUrl(payload.url)
      || typeof payload.cur_price !== 'string'
      || !Number.isFinite(price)
      || price <= 0
      || !Number.isFinite(discount)
      || discount < 0
      || discount >= 100
    ) {
      offerCache.set(cacheKey, { expires: Date.now() + 5 * 60_000, offer: null });
      return null;
    }

    const offer: InstantGamingOffer = {
      name: payload.name,
      url: payload.url,
      price,
      current_price: payload.cur_price,
      discount,
      in_stock: payload.in_stock === true,
      buy_label: typeof payload.buy === 'string' ? payload.buy : "Voir l'offre",
      product_id: payload.prod_id === undefined ? undefined : Number(payload.prod_id),
    };
    offerCache.set(cacheKey, { expires: Date.now() + 15 * 60_000, offer });
    return offer;
  } finally {
    window.clearTimeout(timeout);
  }
}

function wishlistAppId(item: Element): string | null {
  const draggableId = item.getAttribute('data-rfd-draggable-id') ?? '';
  return draggableId.match(/^WishlistItem-(\d+)-/)?.[1] ?? null;
}

function wishlistDetails(item: Element, appId: string): {
  name: string;
  target: Element;
  before: Element | null;
} | null {
  const appPath = `/app/${appId}/`;
  const links = [...item.querySelectorAll<HTMLAnchorElement>('a[href*="/app/"]')]
    .filter(link => link.href.includes(appPath));
  const titleLink = links.find(link => link.textContent?.trim());
  const name = titleLink?.textContent?.trim() ?? '';
  if (!name) return null;

  const priceLink = [...links].reverse().find(link => link !== titleLink && link.textContent?.trim());
  const steamControls = priceLink?.parentElement;
  if (steamControls?.parentElement) {
    return { name, target: steamControls.parentElement, before: steamControls };
  }

  const cartButton = [...item.querySelectorAll<HTMLButtonElement>('button')]
    .find(button => /panier|cart/i.test(button.textContent ?? ''));
  const controls = cartButton?.parentElement?.parentElement;
  return controls?.parentElement ? { name, target: controls.parentElement, before: controls } : null;
}

function createWishlistRow(offer: InstantGamingOffer, appId: string): HTMLDivElement | null {
  const safeUrl = safeOfferUrl(offer.url);
  if (!safeUrl || !offer.in_stock) return null;

  const row = document.createElement('div');
  row.className = WISHLIST_ROW_CLASS;
  row.dataset.migpAppid = appId;

  const button = document.createElement('a');
  button.className = 'migp-wishlist-button';
  button.href = systemBrowserUrl(safeUrl)!;
  button.rel = 'noopener noreferrer';
  button.title = `${offer.name} sur Instant Gaming`;
  button.setAttribute('aria-label', `Voir ${offer.name} sur Instant Gaming`);

  const logo = createOfficialLogo();
  logo.className = 'migp-wishlist-logo';
  button.append(logo);

  const price = document.createElement('span');
  price.className = 'migp-wishlist-price';
  price.textContent = decodeEntities(offer.current_price);
  row.append(price, button);

  for (const eventName of ['click', 'pointerdown', 'mousedown']) {
    button.addEventListener(eventName, event => event.stopPropagation());
  }
  return row;
}

function matchSteamControlSizes(row: HTMLDivElement, steamControls: Element): void {
  const controlsRect = steamControls.getBoundingClientRect();
  const cartControl = steamControls.lastElementChild;
  const cartWidth = cartControl?.getBoundingClientRect().width ?? controlsRect.width * 0.6;
  const priceWidth = Math.max(68, controlsRect.width - cartWidth);
  const height = Math.max(30, controlsRect.height);

  row.style.width = `${controlsRect.width}px`;
  row.style.gridTemplateColumns = `${priceWidth}px ${Math.max(90, cartWidth)}px`;
  row.style.setProperty('--migp-wishlist-control-height', `${height}px`);
}

async function updateWishlistItem(item: HTMLElement): Promise<void> {
  const appId = wishlistAppId(item);
  if (!appId || item.dataset.migpLookup === appId) return;
  if (item.querySelector(`.${WISHLIST_ROW_CLASS}[data-migp-appid="${appId}"]`)) return;

  const details = wishlistDetails(item, appId);
  if (!details) return;
  item.dataset.migpLookup = appId;
  const language = (document.documentElement.lang || navigator.language || 'en').slice(0, 2);

  try {
    const offer = await fetchOffer(appId, details.name, '', language);
    if (!offer || !item.isConnected || wishlistAppId(item) !== appId) return;
    const currentDetails = wishlistDetails(item, appId);
    if (!currentDetails) return;
    const row = createWishlistRow(offer, appId);
    if (!row) return;
    currentDetails.target.insertBefore(row, currentDetails.before);
    matchSteamControlSizes(row, currentDetails.before);
    console.info(`Instant Gaming Price: prix ajouté à la liste de souhaits pour ${offer.name}`);
  } catch (error) {
    delete item.dataset.migpLookup;
    console.info(`Instant Gaming Price: prix temporairement indisponible dans la liste (${appId})`, error);
  }
}

function updateWishlist(): void {
  document.getElementById(CARD_ID)?.remove();
  for (const obsolete of document.querySelectorAll('.migp-wishlist-offer')) obsolete.remove();
  lastLookupKey = '';
  for (const item of document.querySelectorAll<HTMLElement>(WISHLIST_ITEM)) {
    void updateWishlistItem(item);
  }
}

function renderOffer(offer: InstantGamingOffer, purchaseArea: Element): void {
  const safeUrl = safeOfferUrl(offer.url);
  if (!safeUrl || !offer.in_stock) return;

  document.getElementById(CARD_ID)?.remove();
  const root = document.createElement('section');
  root.id = CARD_ID;
  root.setAttribute('aria-label', 'Offre Instant Gaming');

  const card = document.createElement('div');
  card.className = 'migp-card';

  const brand = document.createElement('a');
  brand.className = 'migp-brand';
  brand.href = systemBrowserUrl('https://www.instant-gaming.com/?utm_source=millennium&utm_medium=plugin&utm_campaign=steam-client')!;
  brand.rel = 'noopener noreferrer';
  brand.append(createOfficialLogo());

  const title = document.createElement('div');
  title.className = 'migp-title';
  title.textContent = offer.name;

  const data = document.createElement('div');
  data.className = 'migp-data';

  if (offer.discount > 0) {
    const discount = document.createElement('span');
    discount.className = 'migp-discount';
    discount.textContent = `-${Math.round(offer.discount)}%`;
    data.append(discount);
  }

  const price = document.createElement('span');
  price.className = 'migp-price';
  price.textContent = decodeEntities(offer.current_price);
  data.append(price);

  const buy = document.createElement('a');
  buy.className = 'migp-buy';
  buy.href = systemBrowserUrl(safeUrl)!;
  buy.rel = 'noopener noreferrer';
  buy.textContent = offer.buy_label || "Voir l'offre";
  data.append(buy);

  card.append(brand, title, data);
  root.append(card);
  purchaseArea.prepend(root);
  console.info(`Instant Gaming Price: offre affichée pour ${offer.name}`);
}

function installStyles(): void {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    (document.head || document.documentElement).append(style);
  }
  style.textContent = STYLES;
}

async function updateOffer(): Promise<void> {
  if (WISHLIST_URL.test(location.pathname)) {
    updateWishlist();
    return;
  }

  const appMatch = location.pathname.match(APP_URL);
  if (!appMatch) {
    document.getElementById(CARD_ID)?.remove();
    lastLookupKey = '';
    return;
  }

  const purchaseArea = document.querySelector('#game_area_purchase');
  const gameName = text('.apphub_AppName') || text('#appHubAppName');
  if (!purchaseArea || !gameName) {
    const diagnostic = `attente DOM (achat=${Boolean(purchaseArea)}, titre=${Boolean(gameName)})`;
    if (diagnostic !== lastDiagnostic) {
      lastDiagnostic = diagnostic;
      console.info(`Instant Gaming Price: ${diagnostic}`);
    }
    return;
  }
  lastDiagnostic = '';

  const firstTitle = purchaseArea.querySelector<HTMLElement>('[id^="game_area_purchase_section_add_to_cart_title_"]');
  const editionId = firstTitle?.id.replace('game_area_purchase_section_add_to_cart_title_', '') ?? '';
  const language = (document.documentElement.lang || navigator.language || 'en').slice(0, 2);
  const lookupKey = [appMatch[1], gameName, editionId, language].join('|');
  if (
    lookupKey === lastLookupKey
    && (document.getElementById(CARD_ID) || Date.now() < retryAfter)
  ) return;

  lastLookupKey = lookupKey;
  retryAfter = Date.now() + 10_000;
  const generation = ++requestGeneration;
  console.info(`Instant Gaming Price: recherche de l'AppID ${appMatch[1]}`);
  let offer: InstantGamingOffer | null;
  try {
    offer = await fetchOffer(appMatch[1], gameName, editionId, language);
  } catch (error) {
    retryAfter = Date.now() + 30_000;
    console.info('Instant Gaming Price: offre temporairement indisponible', error);
    return;
  }
  if (generation !== requestGeneration) return;
  if (!offer) {
    retryAfter = Date.now() + 2 * 60_000;
    return;
  }

  try {
    if (location.pathname.match(APP_URL)?.[1] !== appMatch[1]) return;
    renderOffer(offer, purchaseArea);
  } catch (error) {
    retryAfter = Date.now() + 2 * 60_000;
    console.info('Instant Gaming Price: réponse ignorée', error);
  }
}

function scheduleUpdate(): void {
  window.clearTimeout(routeTimer);
  routeTimer = window.setTimeout((): void => { void updateOffer(); }, 120);
}

export default async function main(): Promise<void> {
  console.info(`Instant Gaming Price: webview attachée à ${location.href}`);
  installStyles();
  observer?.disconnect();
  observer = new MutationObserver(scheduleUpdate);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', scheduleUpdate);
  window.addEventListener('hashchange', scheduleUpdate);
  scheduleUpdate();
}
