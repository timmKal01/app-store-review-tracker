const UA = 'AppStoreReviewTracker/0.1 (+contact: app-review-tracker-admin@example.com)';
const PAGE_SIZE = 50;
const MAX_PAGES = 10;

function feedUrl(country, appId, page) {
    return `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`;
}

export async function fetchReviews({ appId, country, startDate, maxResults }) {
    const pagesNeeded = Math.min(Math.ceil(maxResults / PAGE_SIZE), MAX_PAGES);
    const all = [];

    for (let page = 1; page <= pagesNeeded; page++) {
        const res = await fetch(feedUrl(country, appId, page), {
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
