const UA = 'AppStoreReviewTracker/0.1 (+contact: app-review-tracker-admin@example.com)';
const PAGE_SIZE = 50;
const MAX_PAGES = 10;

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { ...options, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) {
                await sleep(1000 * 2 ** (attempt - 1));
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.ok || !TRANSIENT_STATUSES.has(res.status)) return res;
        lastError = new Error(`App Store RSS request failed: ${res.status} ${res.statusText}`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

function feedUrl(country, appId, page) {
    return `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`;
}

export async function fetchReviews({ appId, country, startDate, maxResults }) {
    const pagesNeeded = Math.min(Math.ceil(maxResults / PAGE_SIZE), MAX_PAGES);
    const all = [];

    for (let page = 1; page <= pagesNeeded; page++) {
        const res = await fetchWithRetry(feedUrl(country, appId, page), {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
        });
        if (!res.ok) {
            if (page === 1) throw new Error(`App Store RSS request failed for app ${appId}: ${res.status}`);
            break;
        }

        const data = await res.json();
        const rawEntry = data.feed?.entry;
        const entries = Array.isArray(rawEntry) ? rawEntry : rawEntry ? [rawEntry] : [];
        if (entries.length === 0) break;

        all.push(...entries);

        const oldestOnPage = new Date(entries[entries.length - 1].updated?.label);
        if (oldestOnPage < startDate) break;
    }

    return all
        .filter((e) => e.updated?.label && new Date(e.updated.label) >= startDate)
        .slice(0, maxResults)
        .map((e) => ({
            appId,
            country,
            reviewId: e.id?.label,
            author: e.author?.name?.label ?? null,
            rating: e['im:rating']?.label ? Number(e['im:rating'].label) : null,
            title: e.title?.label ?? null,
            content: e.content?.label ?? null,
            appVersion: e['im:version']?.label ?? null,
            updatedAt: e.updated?.label ?? null,
            reviewUrl: e.link?.attributes?.href ?? null,
        }));
}
