# Mobile design brief

A prompt for designing this site's mobile views. Everything below is what
the site actually is — the palette, the type and the geometry are
transcribed from `ministry-platform.md`, and the behaviour is what the
built application already does. Nothing here is aspirational.

---

## The product

**Repent and Prepare the Way** is the publication desk of the **Ministry of
Repentance and Holiness**, a Christian ministry founded in 2005 and led by
Prophet Dr. David Owuor, based in Nairobi, Kenya, with readers in 61
nations.

It is a **reading site, not a church website**. There are no service times,
no giving page, no event calendar. It publishes four kinds of thing and
holds them permanently:

1. **Articles** — long-form teaching, 8–20 minutes, examining Scripture
   passage by passage and answering the questions readers actually type.
2. **The Prophecy Archive** — a chronology of prophetic messages, each held
   with its original video recording, publication date, location and
   subject.
3. **Teachings** — the same writing arranged by subject rather than by date.
4. **The ministry's own statements** — vision, mission, statement of faith.

The governing editorial rule, and the one that shapes the design:
**provenance is never blurred.** A primary source, an independent record of
what followed, and the ministry's own interpretation are separately
labelled wherever they appear on a page. A design that merges them is wrong
however good it looks.

## The reader

Predominantly **Kenyan, on a phone, on mobile data**. Mobile is not a
reduction of the desktop view here — it is the primary view, and for many
readers the only one. Two consequences:

- Weight is a design constraint. Fonts are self-hosted and subset; images
  are the largest thing on any page. Do not design anything that needs a
  carousel library, a parallax engine, or four typefaces you have not
  budgeted for.
- The reader is often reading a long teaching in one sitting. Legibility
  over a thousand words beats novelty in the first two hundred pixels.

## Voice

Serious, plain, unhurried. Editorial rather than promotional — closer to a
broadsheet's long-read than to a church landing page. No exclamation
marks, no stock-photo enthusiasm, no countdown urgency. Gold is an accent
and a rule; navy is chrome and authority; the ground is warm paper.

---

## The design system

### Colour

```
Ground          #F7F4EC   page
Surface raised  #FBF9F3   header, bands, the hero
Surface card    #FFFDF8   cards, tables, panels
Hairline        #E4DED0   borders
Hairline soft   #EDE7DA   inner rules
Chip            #F1EDE1   tags, subject pills
Chip blue       #EAF0F6   "Article" kind pill
Chip gold       #F4EBD3   "Featured" pill (ink #7A5F1E)

Navy            #123B5D   chrome, headings, footer, primary button
Navy deep       #0D2C46   image wells, button hover
Navy rule       #1D4568   rules on navy
Navy soft       #9FB4C8   text on navy
Navy pale       #C8D6E4   footer body text

Gold            #B8944A   accent ink, rules, kickers
Gold pale       #D8C48E   outlines, rules on navy
Gold sand       #E3CE96   accents on navy
Gold ink        #7A5F1E   text on gold chips

Ink             #14202B   strongest body
Ink 900         #26333F   lead paragraphs
Ink 700         #40505E   running text
Ink 500         #5C6B7A   secondary
Ink 400         #8B98A5   meta, timestamps

Fulfilled       #1E7A4E (badge) / #23935E (on navy)
```

A 2px gold gradient rule — `linear-gradient(90deg,#D8C48E,#B8944A,#D8C48E)`
— closes the header and opens the footer.

**Gold is never a field of paint** except on a chip. It is a rule, a
hairline, a kicker, an outline.

### Type — two layers

The site runs on one rule: **serif for what you read, sans for what you
scan.** There are two sets of faces, and they do not mix.

**The chrome** — everything that is not an article page:

| Role | Family | Used for |
| --- | --- | --- |
| Display | Fraunces 500 | Headlines, card titles, pull quotes |
| Text | Inter | Body, deks, navigation, UI |
| Mono | JetBrains Mono | Kickers, datelines, meta, scripture refs |

**The reading layer** — article pages only, from the headline down:

| Role | Family | Used for |
| --- | --- | --- |
| Article | Newsreader **300** | Headline, italic standfirst, chapter heads |
| Reading | Gentium Book Plus | Body copy and quoted Scripture |
| Apparatus | IBM Plex Sans | Byline, citations, chapter list, questions |

Specifics that matter:

- Kickers: 10–11px, `letter-spacing: 0.12–0.14em`, uppercase.
- Small uppercase labels in the apparatus: `0.19em`.
- Article headlines: Newsreader 300, `letter-spacing: −0.018em`. At 700 a
  large serif shouts; at 300 it is unhurried, which is the register.
- Article body: 19px on a **1.74** line — larger and looser than the
  chrome. Gentium's tall x-height is what carries it on a phone.
- Reading column capped at **34rem** (~65 characters).
- Chrome headlines: Fraunces 500, tracking −0.015em to −0.025em,
  line-height 1.0–1.16.

### Geometry

- Shell: max 1280px, 32px inline padding on desktop, **20px on mobile**.
- Header: 72px tall, sticky, `#FBF9F3`, then the 2px gold rule (75px total).
- Radii: 16px panels, 14px figures, 12px tiles and buttons, 999px chips.
- Breakpoints in use: `sm` 640, `md` 768, `lg` 1024. **The phone view is
  below 640.** Navigation collapses below 1024.

---

## What exists on mobile today

Design against this, not against a blank page. Say explicitly where you are
changing it.

**Masthead** — 72px. Logo + wordmark wrapping to three lines on the left, a
hamburger on the right. The four sections collapse into a drawer below
1024px.

**Drawer** — slides from the right, `min(24rem, 92vw)`. Built to full
dialog standards: focus moves in on open and back to the button on close,
Tab is trapped, Escape and the backdrop dismiss, the page behind cannot
scroll. Each section prints its first three sub-items beneath its name.
Search opens from inside the drawer. Minimum 44px tap targets throughout.

**Home** — paper hero: gold kicker with a rule, navy headline, ink dek,
then two full-width stacked buttons (navy fill, then gold outline). A
hairline closes it. Below: one featured article card (image above text),
then the vision and mission cards stacked.

**Archive** (`/articles`, `/prophecies`) — a cream band with the title and
subject chips, a horizontally-wrapping filter row, then one card per piece.
The dated rail with its year markers is **withdrawn below 640px** — the
card needs the width more, and every card carries its own dateline. Cards
show a 16:9 image above the meta row, headline, three-line excerpt, and a
footer rule with scripture chips left and "READ ARTICLE →" right.

**Article** — single column. The 280px sticky rail is replaced below 1024px
by an in-flow chapter list above the body. A reading-progress bar sits
under the masthead. The body can contain: chapter headings, paragraphs,
Scripture set in a cream figure ruled 3px gold on its opening edge, lists,
comparison tables that scroll inside their own box, three kinds of labelled
callout, a 9:16 YouTube embed, and a FAQ section at the foot set entirely
in the sans face.

**Footer** — navy, opened by the gold rule, five link columns and three
channel buttons (radio, YouTube, WhatsApp).

---

## What to design

Phone views at **390×844**, and state what happens at 320 and at 430.

1. **Home** — hero, featured article, vision and mission.
2. **Articles index** — band, filters, the card list.
3. **An article** — the band, the chapter list, the reading column, and
   every body block named above. This is the most important screen on the
   site; a reader spends ten minutes here and seconds anywhere else.
4. **Prophecy Archive** — the record card with its video poster, date,
   "Primary Source" chip, Fulfilled badge and tags.
5. **A prophecy record** — the meta table, the recording as primary source,
   what was said, the timeline, subsequent events, interpretation. Each
   separately labelled.
6. **The drawer**, open.
7. **Search** — query field, content-type facets, result rows.
8. **About** — statement of faith rows, locations.

## Non-negotiables

- Provenance labels survive at every width. If a card is too narrow for
  "Primary Source", the card changes, not the label.
- Scripture references are always set in the mono face in the chrome, and
  in IBM Plex in an article's apparatus.
- Gold stays a rule and an accent.
- 44px minimum tap targets.
- Nothing horizontally scrolls except a table or a code block, inside its
  own container.
- The reading column stays at its measure. Do not widen it to fill a phone
  edge to edge with 19px type.
- No carousels for articles. The archive is a list; a reader chooses from
  it by scanning, and a carousel hides most of what there is.

## Open questions worth answering in the design

- The masthead wordmark takes three lines on a phone, which costs vertical
  space in a 72px bar. Is there a lockup that reads at one or two?
- Articles published without a photograph currently fall back to a navy
  plate with the section name set on it. Is that the right fallback, or
  should the house art plate — a palette and an icon per category, already
  in the data model but never drawn — finally be designed?
- The prophecy archive's year rail is withdrawn on a phone, so the
  chronology is carried only by each card's dateline. Is a lighter mobile
  treatment of the rail worth the width?
