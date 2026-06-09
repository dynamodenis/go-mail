# Campaigns TODO

## Client-value features

- Add A/B subject testing so a campaign can try two subject lines on a small audience slice before sending the winner.
- Add campaign duplication for recurring newsletters, announcements, and follow-up sequences.
- Add audience preview before send, including sample recipients, excluded unsubscribed contacts, and invalid email counts.
- Add post-send insight summaries that explain what happened and suggest the next improvement.
- Add best-send-time suggestions once enough campaign history exists.

## Product polish

- Preserve an unfinished campaign draft instead of clearing the wizard whenever the create page remounts.
- Replace destructive delete on sent campaigns with archive, and use cancel for scheduled campaigns.
- Represent multi-collection audiences clearly instead of collapsing to a single collection.
- Add a dedicated no-results state for filtered campaign searches.
- Add sorting for sent date, scheduled date, recipients, open rate, and click rate.

## Delivery-readiness

- Validate links in templates before sending.
- Check that required merge tags have matching contact data.
- Confirm unsubscribe/footer compliance before a campaign can send.
- Track campaign send lifecycle actions such as scheduled, cancelled, paused, resumed, and archived.
