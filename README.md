# App Store Review Tracker — New Reviews & Ratings

Track new App Store customer reviews for any app — yours or a
competitor's. Get the rating, review text, author, app version, and date
the moment a new one posts, without checking the App Store by hand.

Built for ASO teams and product managers watching competitor sentiment,
and support teams catching new complaints or bug reports early.

## Input

```json
{
  "appIds": ["284882215"],
  "country": "us",
  "daysBack": 30,
  "maxResultsPerApp": 50
}
```

| Field | Type | Description |
|---|---|---|
| `appIds` | array of strings | Numeric App Store IDs. Find it in the app's App Store URL: `apps.apple.com/us/app/name/id284882215` -> `"284882215"`. One lookup is billed per app. |
| `country` | string | Two-letter App Store storefront country code (e.g. `"us"`, `"gb"`, `"jp"`). Reviews are storefront-specific. Default `"us"`. |
| `daysBack` | number | Only return reviews posted within this many days of today. Default `30`, max `180`. |
| `maxResultsPerApp` | number | Max reviews to return per app, most recent first. Default `50`, max `200`. |

## Output

One record per review:

```json
{
  "appId": "284882215",
  "country": "us",
  "reviewId": "14417910167",
  "author": "dpretlowchapman",
  "rating": 2,
  "title": "I don't like it",
  "content": "I rarely see the post of my friends. Why the change?",
  "appVersion": "573.0.0",
  "updatedAt": "2026-08-12T02:13:11-07:00",
  "reviewUrl": "https://itunes.apple.com/us/review?id=284882215&type=Purple%20Software"
}
```

An app with no reviews in the requested window returns no items but is
still billed once for the lookup.

## How it works

Direct calls to Apple's official public [App Store customer reviews RSS
feed](https://itunes.apple.com/) (`itunes.apple.com/.../rss/customerreviews`),
the same feed that powers third-party ASO tools. No proxy, no key, no
scraping.

## Pricing note

Billed per **app checked**, not per review returned — one charge per app
whether it has 0 or 200 matching reviews.

## Related products

- [Website Lead Extractor](https://github.com/timmKal01/website-lead-extractor) — contact info from a company's website, if you need to reach out rather than just monitor
