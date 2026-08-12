# Published pieces, under version control

The article store itself is not in this repository: `data/` is gitignored,
and a deployment reads Upstash Redis rather than a file. That is the right
arrangement for a desk that publishes from the browser — but it means the
text of a published teaching lives only in whichever store it was posted
to, and a store can be lost.

Anything set by hand rather than typed into the desk is therefore kept
here as well, in exactly the shape `POST /api/articles` accepts. To put one
into a running site:

```bash
curl -X POST "$SITE/api/articles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  --data @content/articles/<slug>.json
```

Locally, with no Redis configured, that writes `data/articles.json`; on the
deployment it writes Redis. Either way the piece appears at
`/articles/<slug>` and at the head of `/articles`.
