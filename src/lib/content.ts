/**
 * The Altar Herald — editorial content model + seed content.
 * In production this is replaced by the CMS/API layer; the shapes here
 * are the contract the frontend renders against.
 */

export type ArtPalette =
  | 'dawn'      // flagship blue → soft sky
  | 'flame'     // gold → ember
  | 'olive'     // green — growth, teaching
  | 'wine'      // deep red — covenant, sacrifice
  | 'orchid'    // violet — prophecy, mystery
  | 'midnight'  // navy — lament, waiting
  | 'harvest'   // amber — provision

export type ArtIcon =
  | 'flame' | 'dove' | 'scroll' | 'mountain' | 'lamp' | 'crown'
  | 'wheat' | 'anchor' | 'star' | 'shepherd' | 'vine' | 'trumpet'
  | 'book' | 'sunrise' | 'well' | 'compass'

export interface ArticleArt {
  palette: ArtPalette
  icon: ArtIcon
}

export interface Author {
  id: string
  name: string
  role: string
  bio: string
  articles: number
  accent: ArtPalette
  /**
   * The editorial desk is a masthead, not a person. Structured data has to
   * say so: crediting an unsigned teaching to a Person that does not exist
   * is exactly the kind of authorship claim Google is now checking.
   */
  kind?: 'person' | 'desk'
}

export type Category =
  | 'Teachings'
  | 'Prophecy'
  | 'Oracles'
  | 'Devotional'
  | 'Doctrine'
  | 'Church History'
  | 'Testimony'

export const CATEGORIES: Category[] = [
  'Teachings',
  'Prophecy',
  'Oracles',
  'Devotional',
  'Doctrine',
  'Church History',
  'Testimony',
]

/** House art plate for articles posted without a photograph. */
export const categoryArt: Record<Category, ArticleArt> = {
  Teachings: { palette: 'olive', icon: 'shepherd' },
  Prophecy: { palette: 'orchid', icon: 'trumpet' },
  Oracles: { palette: 'midnight', icon: 'scroll' },
  Devotional: { palette: 'flame', icon: 'flame' },
  Doctrine: { palette: 'wine', icon: 'book' },
  'Church History': { palette: 'harvest', icon: 'well' },
  Testimony: { palette: 'dawn', icon: 'star' },
}

/* ── Authors ─────────────────────────────────────────────────────── */

export const authors: Author[] = [
  {
    id: 'e-omondi',
    name: 'Rev. Elizabeth Omondi',
    role: 'Senior Teaching Pastor',
    bio: 'Twenty years opening the Scriptures to the church, one passage at a time.',
    articles: 84,
    accent: 'dawn',
  },
  {
    id: 'j-mwangi',
    name: 'Dr. Joseph Mwangi',
    role: 'Editor, Doctrine & Theology',
    bio: 'Theologian and author writing on the creeds, the covenants, and the character of God.',
    articles: 67,
    accent: 'wine',
  },
  {
    id: 'm-carvalho',
    name: 'Miriam Carvalho',
    role: 'Devotional Editor',
    bio: 'Writes the Morning Portion and the quiet columns on prayer and waiting.',
    articles: 152,
    accent: 'flame',
  },
  {
    id: 'd-okech',
    name: 'Prophet Daniel Okech',
    role: 'Oracles & Prophecy Desk',
    bio: 'Stewards the ministry’s prophetic record with sobriety, testing every word.',
    articles: 41,
    accent: 'orchid',
  },
  {
    id: 's-njeri',
    name: 'Sarah Njeri',
    role: 'Church History Correspondent',
    bio: 'Tells the two-thousand-year story of the church as if it happened yesterday.',
    articles: 58,
    accent: 'olive',
  },
  {
    id: 'editorial-desk',
    name: 'The Editorial Desk',
    role: 'Repent and Prepare the Way',
    bio: 'Unsigned teachings from the publication desk of the ministry.',
    articles: 12,
    accent: 'flame',
    kind: 'desk',
  },
]

export const authorById = (id: string): Author =>
  authors.find((a) => a.id === id) ?? authors[0]

/* ── Site chrome ─────────────────────────────────────────────────── */

/**
 * The four sections, in the order the design sets them.
 *
 * `items` is what each section holds. The drawer prints the first few
 * under the section name, so a reader on a phone can see what is behind a
 * link before opening it.
 */
export interface NavSection {
  label: string
  href: string
  items: string[]
}

export const navSections: NavSection[] = [
  {
    label: 'Articles',
    href: '/',
    items: [
      'Latest Articles', 'Bible Studies', 'Scripture Explained',
      'Questions Answered', 'Series', 'By Subject', 'Archive by Year',
    ],
  },
  {
    label: 'Prophecy Archive',
    href: '/prophecies',
    items: [
      'Recent Prophecies', 'Earthquakes', 'Nations',
      'Global Events', 'Historical Records', 'By Year',
    ],
  },
  {
    label: 'Teachings',
    href: '/teachings',
    items: [
      'Repentance', 'Holiness', 'Rapture', 'Second Coming',
      'End Times', 'Salvation', 'Righteousness', 'Preparation',
    ],
  },
  {
    label: 'About',
    href: '/about',
    items: [
      'The Ministry', 'History', 'Mission', 'Leadership',
      'Statement of Faith', 'What We Believe', 'Altars & Locations',
    ],
  },
]

/**
 * Where this site lives, as it tells the outside world.
 *
 * Every canonical tag, the sitemap, the feed, every Open Graph URL and
 * every `@id` in the structured data is built from this one value — a
 * hundred and sixty of them. Which is why it cannot be a constant: a
 * deployment that serves one address while declaring another is telling
 * Google the real page is somewhere else, and Google believes it. The
 * site would look simply un-indexed, with nothing on the page to say why.
 *
 * `NEXT_PUBLIC_` because `content.ts` is imported by client components,
 * so the value has to survive into the browser bundle. Set it in the
 * deployment to whatever host actually answers — including the port, if
 * there is one.
 *
 * The default is the address the site is actually served from today, so a
 * deployment nobody has configured describes itself correctly rather than
 * pointing at a domain the ministry does not yet control. When the site
 * moves to its permanent home, change this line or set the variable —
 * either works, and both move every canonical, the sitemap, the feed, the
 * Open Graph tags and the structured data together.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://read.repentanceonline.com')
  .trim()
  .replace(/\/+$/, '')

/** The address without its scheme, for the places that print it as words. */
export const siteHost = siteUrl.replace(/^https?:\/\//, '')

/**
 * Where a reader is told that something new has been published.
 *
 * The site had no such place at all: a ministry publishing weekly, and
 * nothing but an RSS feed almost nobody uses. WhatsApp is the channel
 * this congregation already reads on — the share row has put it first
 * since the day it shipped — and a channel link asks nothing of the
 * reader and stores nothing about them: no address, no consent to keep,
 * nothing to unsubscribe from at this end.
 *
 * Set NEXT_PUBLIC_WHATSAPP_CHANNEL to the ministry's own channel invite.
 * Unset, nothing is offered — an invitation to a channel that does not
 * exist is worse than no invitation.
 */
export const newTeachingsChannel = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL ?? ''

/* ── Official channels ───────────────────────────────────────────── */

export interface Channel {
  key: 'radio' | 'youtube' | 'whatsapp'
  name: string
  /** One line under the name wherever the channel is shown as a card/row. */
  tagline: string
  cta: string
  href: string
  /** Live now — rendered with the pulsing on-air dot. */
  live?: boolean
}

/** Jesus is LORD Radio — the ministry's 24/7 carrier station. */
export const radioChannel: Channel = {
  key: 'radio',
  name: 'Jesus is LORD Radio',
  tagline: 'The ministry’s 24/7 station — worship, teachings, and live services.',
  cta: 'Listen live',
  href: 'https://www.jesusislordradio.info',
  live: true,
}

export const youtubeChannel: Channel = {
  key: 'youtube',
  name: 'YouTube',
  tagline: 'Watch services, revival meetings, and teachings from the altar.',
  cta: 'Watch',
  href: 'https://www.youtube.com/c/RepentPreparetheway',
}

/* WhatsApp is the distribution channel: this link opens a ready-to-send
   invitation. Once the ministry has a WhatsApp Channel, put its invite
   in NEXT_PUBLIC_WHATSAPP_CHANNEL: this entry follows it, and the
   "new teachings" invitation appears wherever FollowChannel is set. */
export const whatsappChannel: Channel = {
  key: 'whatsapp',
  name: 'WhatsApp',
  tagline: 'Send the reading room to a friend — evangelism one chat at a time.',
  cta: 'Share',
  href:
    newTeachingsChannel ||
    `https://wa.me/?text=${encodeURIComponent(
      `Repent and Prepare the Way — teachings, prophecies, and oracles from the Ministry of Repentance and Holiness. ${siteUrl}`
    )}`,
}

/** Every channel icon on the site reads from this list. */
export const channels: Channel[] = [radioChannel, youtubeChannel, whatsappChannel]

/* ── Pastoral care ───────────────────────────────────────────────── */

/**
 * How to reach the ministry when the reason is not editorial.
 *
 * A teaching on suffering that ends without a way to speak to a person is
 * an article about pastoral care rather than an act of it, so these sit at
 * the foot of every page a reader might be on when they decide to ask for
 * help. The numbers are the ministry's own; nothing here is inferred.
 */
export interface CareLine {
  kind: 'phone' | 'whatsapp' | 'email'
  label: string
  /** One entry per number or address, each with the link it opens. */
  contacts: { text: string; href: string }[]
}

export const pastoralCare = {
  kicker: 'Pastoral care',
  title: 'In need of spiritual help?',
  body: 'Reach out on the hotline, on WhatsApp, or by email. Someone from the ministry will respond.',
  office: 'Head office · 195 Ruaka Rd, Runda, Nairobi, Kenya',
  lines: [
    {
      kind: 'phone',
      label: 'Hotline',
      contacts: [
        { text: '+254 715 276091', href: 'tel:+254715276091' },
        { text: '+254 708 412344', href: 'tel:+254708412344' },
      ],
    },
    {
      kind: 'whatsapp',
      label: 'WhatsApp',
      contacts: [{ text: '+254 715 276091', href: 'https://wa.me/254715276091' }],
    },
    {
      kind: 'email',
      label: 'Email',
      contacts: [{ text: 'repentoffice@gmail.com', href: 'mailto:repentoffice@gmail.com' }],
    },
  ] as CareLine[],
}

export const siteInfo = {
  name: 'Repent and Prepare the Way',
  ministry: 'Ministry of Repentance and Holiness',
  head: 'Prophet Dr. David Owuor',
  tagline: 'Wisdom · Hope · Truth',
  mission: 'The publication desk of the Ministry of Repentance and Holiness — teachings, prophecies, and oracles, faithfully told.',
  /* The whole of what this site is, in four lines, in the ministry's own
     wording — the canonical short description, for anywhere that has to
     introduce the site to someone who has never heard of the ministry.
     Nothing renders it today; it is here so that when something does, it
     does not invent a fifth way of saying this. */
  summary:
    'Repent and Prepare the Way publishes the teaching of the Ministry of Repentance and Holiness — a Kenyan ministry led by Prophet Dr. David Owuor, preaching repentance, holiness, and preparation for the return of Jesus Christ. Every article answers one question from Scripture.',
  readers: '84,000',
  nations: 61,
}

/* ── Topics ──────────────────────────────────────────────────────── */

/**
 * Every category is also a landing page at /topics/<slug>. These pages are
 * the ranking surface for the five sections that have no place in the top
 * navigation — Oracles, Devotional, Doctrine, Church History, Testimony —
 * and they exist only while a category actually has published pieces.
 */
export const categorySlug = (category: Category): string =>
  category.toLowerCase().replace(/\s+/g, '-')

export const categoryFromSlug = (slug: string): Category | null =>
  CATEGORIES.find((category) => categorySlug(category) === slug) ?? null

export const topicHref = (category: Category): string =>
  `/topics/${categorySlug(category)}`

/** The one line a topic page leads with, and its meta description. */
export const categoryBlurb: Record<Category, string> = {
  Teachings:
    'Expositions and sermons from the Ministry of Repentance and Holiness — the Scriptures opened for the church.',
  Prophecy:
    'The prophetic record of the ministry, read with sobriety — every word weighed and tested against Scripture.',
  Oracles:
    'The oracles of the LORD as they were given, set down plainly and kept on the record.',
  Devotional:
    'Short readings for the quiet hours — prayer, waiting, and the daily walk with the Lord.',
  Doctrine:
    'The creeds, the covenants, and the character of God, taught carefully for the whole church.',
  'Church History':
    'The two-thousand-year story of the church, told as though it happened yesterday.',
  Testimony:
    'What the Lord has done, in the words of the people He did it for.',
}

/* ── Authors ─────────────────────────────────────────────────────── */

/**
 * Articles store an author's display name, not an id, so the byline is the
 * join key back to the author table. Returns undefined for a name that has
 * no profile — the byline still renders, it simply does not link out.
 */
export const authorByName = (name: string): Author | undefined =>
  authors.find((author) => author.name === name)

export const authorHref = (author: Author): string => `/authors/${author.id}`

/* ── The home page ───────────────────────────────────────────────── */

/**
 * What the front page says. The hero is one claim and two ways in; the
 * vision and the mission are the ministry's own statements, each carrying
 * the Scriptures it is drawn from.
 */
export const homeHero = {
  kicker: 'Since 2003 · Nairobi, Kenya',
  title: ['Prepare the Way.', 'The Messiah Is Coming.'],
  dek: 'Biblical teachings, Scripture studies, prophetic messages, sermons, and resources from the Ministry of Repentance and Holiness.',
  primary: { label: 'Watch the Prophecies', href: '/prophecies' },
  secondary: { label: 'About the Ministry', href: '/about' },
}

export interface Statement {
  kicker: string
  title: string
  body: string
  refs: string[]
}

export const visionStatement: Statement = {
  kicker: 'Our Vision',
  title: 'The Messiah is coming.',
  body:
    'Drawn from the promises the Lord Jesus made to the Church in John 14:1–4, and from the desire of the ministry to warn the whole Church of Christ about the fulfilment of the signs that bring the Messiah, so that it is not caught unaware at His coming.',
  refs: [
    'John 14:1–4',
    'Isaiah 26:19–21',
    '1 Thessalonians 4:16–17',
    'Matthew 24',
    'Matthew 25',
    'Malachi 4:5',
    '1 Thessalonians 5:4',
  ],
}

export const missionStatement: Statement = {
  kicker: 'Our Mission',
  title: 'To prepare the way for the coming of the Messiah.',
  body:
    'Derived from Isaiah 40:3–5: “The voice of him that crieth in the wilderness, Prepare ye the way of the LORD, make straight in the desert a highway for our God.”',
  refs: ['Isaiah 40:3–5'],
}

/* ── The articles index ──────────────────────────────────────────── */

/** The subjects a reader can browse the writing by. */
export const articleSubjects = [
  'Repentance',
  'Holiness',
  'Rapture',
  'Second Coming',
  'End Times',
  'Salvation',
  'Prayer',
  'Preparation',
]

/* ── About the ministry ──────────────────────────────────────────── */

/**
 * The one figure on the About page that is not counted from the site's own
 * content. Everything else in that row is derived, so it cannot drift out
 * of date or overstate what the archive actually holds.
 */
export const foundingYear = '2005'

/** The sections of the About page that exist, in the order they appear. */
export const aboutSections = [
  { label: 'The Ministry', href: '#ministry' },
  { label: 'Why This Platform Exists', href: '#why' },
  { label: 'The Message', href: '#message' },
  { label: 'Our Mission', href: '#mission' },
  { label: 'Explore the Message', href: '#explore' },
  { label: 'What We Believe', href: '#faith' },
  { label: 'Where We Meet', href: '#locations' },
]

export const faithArticles = [
  {
    num: '01',
    title: 'The Scriptures',
    body: 'We believe the Holy Scriptures are the Word of God and the foundation for Christian faith and life.',
    refs: '2 Timothy 3:16–17 · 2 Peter 1:20–21',
  },
  {
    num: '02',
    title: 'Repentance and Holiness',
    body: 'We believe God calls people to turn away from sin, return to Him, and pursue holiness.',
    refs: 'Acts 3:19 · Hebrews 12:14',
  },
  {
    num: '03',
    title: 'The Coming of the Messiah',
    body: 'We believe Jesus Christ will return, and that His Church is called to remain watchful and ready.',
    refs: '1 Thessalonians 4:16–17 · Matthew 24',
  },
  {
    num: '04',
    title: 'The Kingdom of God',
    body: 'We look forward to the fulfilment of God\u2019s promises and the eternal reign of Christ.',
    refs: 'Revelation 19 · Zechariah 14',
  },
]

/**
 * Kenya's forty-seven counties, in the order the Constitution numbers
 * them, and the altars each one gathers at.
 *
 * Every altar here carries the ministry's own coordinates and the Google
 * place the ministry gave for it, so the pin a reader opens is the pin
 * the ministry named rather than a guess this desk made from a search
 * box. Where the clergy leading that altar published a number, it is on
 * the card: a reader who wants to ask about a service should not have to
 * find the head office first.
 *
 * `confirmed: false` marks an altar whose place has been matched but not
 * checked on the ground. It still links — a probable pin with a warning
 * on it is more use than nothing — but it says so, in the same voice the
 * prophecy records use for a date that is still to be confirmed.
 *
 * A county with no altars is listed all the same. The ministry gathers
 * across the whole country; it is only the meeting place we do not have.
 */
export interface Altar {
  name: string
  area: string
  /** The Google place, as the ministry supplied it. */
  placeId: string
  /** [latitude, longitude] — the authority behind the pin. */
  at: [number, number]
  /** The clergy leading this altar, where a number is published. */
  phone?: string
  /** Absent means confirmed; false means matched but not yet checked. */
  confirmed?: false
}

export interface County {
  no: number
  name: string
  altars?: Altar[]
}

export const counties: County[] = [
  {
    no: 1,
    name: 'Mombasa',
    altars: [
      {
        name: 'Mombasa Main Altar Repentance and Holiness Church',
        area: 'Mathenge Rd, Mombasa',
        placeId: 'ChIJ5SShzD0TQBgRvGw0KtcmFPc',
        at: [-4.0712652, 39.670612],
      },
    ],
  },
  { no: 2, name: 'Kwale' },
  {
    no: 3,
    name: 'Kilifi',
    altars: [
      {
        name: 'Kilifi Main Altar - Mtwapa',
        area: 'B8, Mtwapa',
        placeId: 'ChIJaWpdUtMJQBgRD5yW2yMb2Hs',
        at: [-3.9419321, 39.7407246],
      },
    ],
  },
  { no: 4, name: 'Tana River' },
  { no: 5, name: 'Lamu' },
  { no: 6, name: 'Taita–Taveta' },
  { no: 7, name: 'Garissa' },
  { no: 8, name: 'Wajir' },
  { no: 9, name: 'Mandera' },
  { no: 10, name: 'Marsabit' },
  { no: 11, name: 'Isiolo' },
  {
    no: 12,
    name: 'Meru',
    altars: [
      {
        name: 'Ministry of Repentance and Holiness - Meru Main Altar',
        area: 'Meru',
        placeId: 'ChIJid1dDAAZiBcRPbiWaa7qs6E',
        at: [0.0744152, 37.6280157],
      },
    ],
  },
  { no: 13, name: 'Tharaka-Nithi' },
  {
    no: 14,
    name: 'Embu',
    altars: [
      {
        name: 'Embu Main Altar',
        area: 'Kamiu, Embu',
        placeId: 'ChIJpdsedMstJhgRtgE8UKbH3O8',
        at: [-0.5307793, 37.4606926],
      },
    ],
  },
  { no: 15, name: 'Kitui' },
  {
    no: 16,
    name: 'Machakos',
    altars: [
      {
        name: 'Machakos Main Altar',
        area: 'Machakos',
        placeId: 'ChIJb1xDLQCHLxgRBT7VG5c9r14',
        at: [-1.5224628, 37.2520603],
      },
    ],
  },
  { no: 17, name: 'Makueni' },
  { no: 18, name: 'Nyandarua' },
  {
    no: 19,
    name: 'Nyeri',
    altars: [
      {
        name: 'Ministry of Repentance and Holiness, Nyeri Main Altar',
        area: '2NK Proposed Site, Nyeri',
        placeId: 'ChIJAQA_2bxgKBgROA5Ov_6vLXg',
        at: [-0.4329198, 36.9636817],
        phone: '+254 727 696651',
      },
    ],
  },
  {
    no: 20,
    name: 'Kirinyaga',
    altars: [
      {
        name: 'Kerugoya Main Altar',
        area: 'Kerugoya',
        placeId: 'ChIJu3sp6xKBKBgRTLt8cShnlgE',
        at: [-0.5037984, 37.2765587],
        phone: '+254 722 579761',
      },
    ],
  },
  {
    no: 21,
    name: 'Murang’a',
    altars: [
      {
        name: 'Murang\'a Main Altar',
        area: 'Murang\'a',
        placeId: 'ChIJmUpAeiajKBgRsNXot5FLu3M',
        at: [-0.7237946, 37.1649933],
        phone: '+254 722 243841',
      },
    ],
  },
  {
    no: 22,
    name: 'Kiambu',
    altars: [
      {
        name: 'Thika Main Altar',
        area: 'Garissa Rd, Thika',
        placeId: 'ChIJzXorAQBPLxgRxsqvLI8xQr0',
        at: [-1.0523418, 37.0801804],
        phone: '+254 723 957237',
      },
    ],
  },
  { no: 23, name: 'Turkana' },
  { no: 24, name: 'West Pokot' },
  { no: 25, name: 'Samburu' },
  {
    no: 26,
    name: 'Trans Nzoia',
    altars: [
      {
        name: 'Ministry of Repentance and Holiness, Kitale',
        area: 'Kenyatta St, Kitale',
        placeId: 'ChIJ87bJEqUnghcRFR3bLkagVGQ',
        at: [1.0155585, 35.0038091],
        confirmed: false,
      },
    ],
  },
  {
    no: 27,
    name: 'Uasin Gishu',
    altars: [
      {
        name: 'Uasin Gishu Main Altar Eldoret',
        area: 'Eldoret',
        placeId: 'ChIJFZ5sUJMBgRcRjIgb_LI9Xd8',
        at: [0.5153718, 35.2704876],
        phone: '+254 722 969443',
      },
    ],
  },
  { no: 28, name: 'Elgeyo-Marakwet' },
  { no: 29, name: 'Nandi' },
  { no: 30, name: 'Baringo' },
  {
    no: 31,
    name: 'Laikipia',
    altars: [
      {
        name: 'Nanyuki Main Altar',
        area: 'Nanyuki',
        placeId: 'ChIJ_w15djr2hxcRmn6ffxSr2-s',
        at: [0.0099899, 37.0720915],
      },
      {
        name: 'Nyahururu Main Altar',
        area: 'Nyahururu',
        placeId: 'ChIJw1hPVQBjhxcR0YjH6ze-WF0',
        at: [0.0241365, 36.3526969],
        confirmed: false,
      },
    ],
  },
  {
    no: 32,
    name: 'Nakuru',
    altars: [
      {
        name: 'Repentance & Holiness Ministry - Nakuru Main Altar',
        area: 'Nakuru Showground',
        placeId: 'ChIJ9ewI7KSNKRgRJdhhpH8AhhM',
        at: [-0.2743667, 36.0596523],
        phone: '+254 721 861407',
      },
    ],
  },
  {
    no: 33,
    name: 'Narok',
    altars: [
      {
        name: 'Jerusalem Main Altar, Narok',
        area: 'Narok',
        placeId: 'ChIJ9WZfVAADLBgRO2XYL3hq0WY',
        at: [-1.0906984, 35.8586848],
        confirmed: false,
      },
    ],
  },
  {
    no: 34,
    name: 'Kajiado',
    altars: [
      {
        name: 'Noonkopir Altar, Kitengela',
        area: 'Kitengela',
        placeId: 'ChIJy_QboQGgLxgRVoAGA0DCkWY',
        at: [-1.4668018, 36.951629],
        phone: '+254 720 333500',
        confirmed: false,
      },
    ],
  },
  {
    no: 35,
    name: 'Kericho',
    altars: [
      {
        name: 'Kericho Main Altar',
        area: 'Kericho',
        placeId: 'ChIJw4uKLgBZKhgR4k3j7pprFlw',
        at: [-0.3626601, 35.2886314],
      },
    ],
  },
  {
    no: 36,
    name: 'Bomet',
    altars: [
      {
        name: 'Repentance and Holiness Church Bomet',
        area: 'Bomet',
        placeId: 'ChIJw6etoCCZKxgRJhgkiYvnnF4',
        at: [-0.7774142, 35.3341957],
        phone: '+254 724 384785',
        confirmed: false,
      },
    ],
  },
  {
    no: 37,
    name: 'Kakamega',
    altars: [
      {
        name: 'Kakamega Main Altar',
        area: 'Mahiakalo, Kakamega',
        placeId: 'ChIJJxfTAgA9gBcRzBufvamhTLI',
        at: [0.2909739, 34.7687923],
      },
    ],
  },
  { no: 38, name: 'Vihiga' },
  {
    no: 39,
    name: 'Bungoma',
    altars: [
      {
        name: 'Bungoma Main Altar',
        area: 'Bungoma',
        placeId: 'ChIJQT8QGQDXgRcR12J0h9sRnBw',
        at: [0.5894625, 34.5803594],
      },
    ],
  },
  {
    no: 40,
    name: 'Busia',
    altars: [
      {
        name: 'Busia Main Altar',
        area: 'Busia',
        placeId: 'ChIJiy4zCfyhfxcRpOu74UfFDbs',
        at: [0.4611057, 34.1082479],
      },
    ],
  },
  {
    no: 41,
    name: 'Siaya',
    altars: [
      {
        name: 'Siaya Main Altar',
        area: 'Siaya',
        placeId: 'ChIJoey-5YDjfxcR0ih0_9sGl2U',
        at: [0.060188, 34.2829487],
      },
    ],
  },
  {
    no: 42,
    name: 'Kisumu',
    altars: [
      {
        name: 'Ministry of Repentance and Holiness, Oasis Altar',
        area: 'Kisumu',
        placeId: 'ChIJyYhhvGWlKhgRCl-52qjyPgA',
        at: [-0.1101394, 34.7727818],
        phone: '+254 725 946177',
        confirmed: false,
      },
    ],
  },
  {
    no: 43,
    name: 'Homa Bay',
    altars: [
      {
        name: 'Homa Bay Main Altar',
        area: 'Homa Bay',
        placeId: 'ChIJG15EXt7V1BkRUeBb3JzKc_w',
        at: [-0.5248316, 34.4583264],
        phone: '+254 727 233488',
      },
    ],
  },
  {
    no: 44,
    name: 'Migori',
    altars: [
      {
        name: 'Shiloam Altar, Migori',
        area: 'Ulanda, Migori',
        placeId: 'ChIJ8wMT6cyrLBgRoxdhixNUmhI',
        at: [-1.0081886, 34.5850229],
        confirmed: false,
      },
    ],
  },
  {
    no: 45,
    name: 'Kisii',
    altars: [
      {
        name: 'Repentance and Holiness Ministry - Kisii Main Altar',
        area: 'Kisii',
        placeId: 'ChIJqcueUgQ7KxgR0sPv2AHUWjQ',
        at: [-0.6799777, 34.7675027],
        phone: '+254 721 363158',
      },
    ],
  },
  { no: 46, name: 'Nyamira' },
  {
    no: 47,
    name: 'Nairobi City',
    altars: [
      {
        name: 'Repentance and Holiness Nairobi Main Altar',
        area: 'Muthurwa, Nairobi',
        placeId: 'ChIJ8cVzNDsRLxgRZfapeiZMmdc',
        at: [-1.2899457, 36.8360263],
        phone: '+254 722 654518',
      },
    ],
  },
]

/**
 * The place, opened on the map.
 *
 * Coordinates first and the place id second is Google's documented way of
 * saying "this exact place": if the id is ever retired the pin still
 * lands on the right ground rather than on a search page.
 */
export const altarHref = (altar: Altar) =>
  `https://www.google.com/maps/search/?api=1&query=${altar.at[0]},${altar.at[1]}&query_place_id=${altar.placeId}`

/* ── The footer ──────────────────────────────────────────────────── */

/* There were five columns of links here, then three, and now none.
   The footer is the seal, what the site is, the three official channels,
   and the legal bar — nothing else.

   Losing them costs the site its own internal linking, which is worth
   naming rather than pretending otherwise: the footer is where a reader
   who has reached the bottom of a page is offered somewhere else to go.
   Every destination they carried is still reachable, and that was checked
   rather than assumed — About, Search, Saved, RSS and the sitemap in the
   legal bar; Articles, the prophetic record, Teachings and About in the
   masthead at every width; the altars from the About page and from the
   offline page; the three channels from the icons in the block above,
   which is where they already were. */
