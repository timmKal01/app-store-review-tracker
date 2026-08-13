import { Actor, log } from 'apify';
import { fetchReviews } from './appstore.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { appIds = [], country = 'us', daysBack = 30, maxResultsPerApp = 50 } = input;

if (appIds.length === 0) {
    throw new Error('No appIds provided.');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const APP_CHECKED_EVENT = 'app-checked';

const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

for (const appId of appIds) {
    let reviews;
    try {
        reviews = await fetchReviews({
            appId: String(appId).trim(),
            country: country.trim().toLowerCase(),
            startDate,
            maxResults: Math.min(maxResultsPerApp, 200),
        });
    } catch (err) {
        log.warning(`Failed to fetch reviews`, { appId, error: err.message });
        continue;
    }

    if (reviews.length > 0) {
        await Actor.pushData(reviews);
    }
    await Actor.charge({ eventName: APP_CHECKED_EVENT });

    log.info(`Checked app`, { appId, reviewsFound: reviews.length });
}

await Actor.exit();
