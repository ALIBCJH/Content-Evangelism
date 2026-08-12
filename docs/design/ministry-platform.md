# Ministry Platform — design specification

The source of truth for this site's visual design is the `Ministry Platform`
prototype. Everything below is transcribed from it; nothing here is invented.
When a component and this file disagree, this file is right.

## Type

| Role | Family | Notes |
| --- | --- | --- |
| Display | **Fraunces** 400/500/600/700 | Headlines, standfirsts, card titles, pull quotes, stat figures |
| Text | **Inter** 400/500/600/700 | Body copy, deks, UI, navigation |
| Mono | **JetBrains Mono** 400/500 | Kickers, datelines, meta, scripture refs, badges, "READ →" |

Kicker: 10–11px, `letter-spacing: 0.12–0.14em`, uppercase.
Headlines are Fraunces **500** with negative tracking (−0.015em to −0.025em)
and line-heights of 1.0–1.16. Body is Inter 15–19px at 1.7–1.8.

## Colour

```
Ground          #F7F4EC   page
Surface raised  #FBF9F3   header, bands, quote figures
Surface card    #FFFDF8   cards, tables, panels
Hairline        #E4DED0   borders
Hairline soft   #EDE7DA   inner rules
Chip            #F1EDE1   tags, subject pills
Chip blue       #EAF0F6   "Article" kind pill
Chip gold       #F4EBD3   "Featured" / "Primary Source" pill (ink #7A5F1E)

Navy            #123B5D   chrome, headings, footer
Navy deep       #0D2C46   image wells, hero ground
Navy rule       #1D4568   rules on navy
Navy soft       #9FB4C8   text on navy
Navy pale       #C8D6E4   footer body text

Gold            #B8944A   accent ink, primary button
Gold light      #C9A961   button hover
Gold pale       #D8C48E   rules, on-navy accents
Gold sand       #E3CE96   hero kicker
Gold ink        #7A5F1E   text on gold chips

Ink             #14202B   strongest body
Ink 900         #26333F   lead paragraphs
Ink 700         #40505E   running text
Ink 500         #5C6B7A   secondary
Ink 400         #8B98A5   meta, timestamps

Fulfilled       #1E7A4E (badge) / #23935E (on navy)
```

The 2px gold gradient rule — `linear-gradient(90deg,#D8C48E,#B8944A,#D8C48E)` —
closes the header and opens the footer.

## Geometry

- Shell: `max-width: 1280px`, `padding-inline: 32px`.
- Header: 72px tall, sticky, `#FBF9F3`, then the gold rule.
- Radii: 16px cards/panels, 14px figures/tiles, 12px thumbnails/buttons,
  999px chips.
- Sticky sidebars sit at `top: 104px` (header + rule + air).
- Article page: `minmax(0,1fr) 280px` with a 72px gutter.
- Prophecy record: `minmax(0,1fr) 300px`.

## Page templates

1. **Home** — full-bleed navy hero (min 660px) with photograph, gradient
   scrim, mono kicker, 84px Fraunces headline, dek, gold + outline CTAs;
   gold rule; Featured Article (text ⟷ image, 16px radius); Vision and
   Mission cards side by side with scripture chips.
2. **Articles** — cream band with title, dek and subject chips; filter row;
   featured card; list rows with 4:3 thumbnails, and a sticky sidebar
   (Series, From the archive).
3. **Article** — breadcrumb, title + standfirst beside a 3:2 image, then the
   reading column with a 280px sticky rail (On this page, Key scriptures).
   Scripture sits in a cream figure ruled 3px gold on its opening edge.
4. **Prophecy Archive** — a year rail down the left with a dotted timeline,
   records as cards with 16:9 thumbnails, Fulfilled badges and tag chips.
5. **Record** — navy header with the meta table, the original recording as
   the primary source, What Was Said, Timeline, Subsequent Events
   (independent), and Interpretation, each labelled for provenance.
6. **About** — header with in-section links, stats, statement of faith rows,
   sticky Locations panel.
7. **Search** — query field, content-type facets, result rows.
8. **Mobile** — single column, full-bleed hero, stacked CTAs, drawer menu
   with 44px minimum tap targets.

## Rules carried from the prototype

- Provenance is never blurred: primary source, independent record, and
  ministry interpretation are separately labelled wherever they appear.
- Gold is a rule and an accent, never a field of paint except on buttons.
- Scripture references are always set in JetBrains Mono.
