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

export interface Article {
  slug: string
  title: string
  dek: string
  category: Category
  authorId: string
  publishedAt: string // ISO date
  readMinutes: number
  art: ArticleArt
  /** Real photograph — used instead of the generated art plate when set. */
  image?: { src: string; alt: string; width: number; height: number }
  /** Route to the full article page, when one exists. */
  href?: string
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

/* ── Articles ────────────────────────────────────────────────────── */

/* ── The Cross of Jesus — the first fully published article. ─────── */

export const crossArticle: Article = {
  slug: 'the-cross-of-jesus',
  title: 'The Cross of Jesus: Where Repentance Meets Mercy',
  dek: 'Before it was ever an ornament, it was an execution. Yet at that darkest instrument of Rome, the holiness of God and the hope of sinners met once and for all. The cross stands at the center of history — and at the door of every human heart — asking the one question none of us can avoid: what will you do with the Man who hung here?',
  category: 'Teachings',
  authorId: 'editorial-desk',
  publishedAt: '2026-07-31',
  readMinutes: 8,
  art: { palette: 'flame', icon: 'star' },
  image: {
    src: '/images/the-cross-of-jesus.png',
    alt: 'A rugged wooden cross draped with a white cloth, standing against a golden sunrise sky',
    width: 1155,
    height: 658,
  },
  href: '/articles/the-cross-of-jesus',
}

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
    href: '/articles',
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
      'Statement of Faith', 'What We Believe', 'Locations',
    ],
  },
]

export const siteUrl = 'https://repentandpreparetheway.org'

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
   invitation. Swap the href for the ministry's WhatsApp Channel invite
   link once one exists — nothing else needs to change. */
export const whatsappChannel: Channel = {
  key: 'whatsapp',
  name: 'WhatsApp',
  tagline: 'Send the reading room to a friend — evangelism one chat at a time.',
  cta: 'Share',
  href: `https://wa.me/?text=${encodeURIComponent(
    `Repent and Prepare the Way — teachings, prophecies, and oracles from the Ministry of Repentance and Holiness. ${siteUrl}`
  )}`,
}

/** Every channel icon on the site reads from this list. */
export const channels: Channel[] = [radioChannel, youtubeChannel, whatsappChannel]

export const siteInfo = {
  name: 'Repent and Prepare the Way',
  ministry: 'Ministry of Repentance and Holiness',
  head: 'Prophet Dr. David Owuor',
  tagline: 'Wisdom · Hope · Truth',
  mission: 'The publication desk of the Ministry of Repentance and Holiness — teachings, prophecies, and oracles, faithfully told.',
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
  primary: { label: 'Read the Articles', href: '/articles' },
  secondary: { label: 'Watch the Prophecies', href: '/prophecies' },
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
  { label: 'Mission', href: '#mission' },
  { label: 'Statement of Faith', href: '#faith' },
  { label: 'Locations', href: '#locations' },
]

export const faithArticles = [
  { num: '01', title: 'Scripture', refs: '2 Timothy 3:16 · 2 Peter 1:21' },
  { num: '02', title: 'Repentance and Holiness', refs: 'Acts 3:19 · Hebrews 12:14' },
  { num: '03', title: 'The Rapture of the Church', refs: '1 Thessalonians 4:16–17 · Matthew 24' },
  { num: '04', title: 'The Second Coming of the Messiah', refs: 'Revelation 19 · Zechariah 14' },
]

export const locations = [
  { city: 'Nairobi', detail: 'Kenya · Main altar' },
  { city: 'Kisumu', detail: 'Kenya' },
  { city: 'Bogotá', detail: 'Colombia' },
  { city: 'Kampala', detail: 'Uganda' },
]

/* ── The footer ──────────────────────────────────────────────────── */

export interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Ministry',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Mission', href: '/about#mission' },
      { label: 'Statement of Faith', href: '/about#faith' },
      { label: 'Locations', href: '/about#locations' },
    ],
  },
  {
    title: 'Teachings',
    links: [
      { label: 'All Teachings', href: '/teachings' },
      { label: 'Repentance', href: '/topics/teachings' },
      { label: 'Prophecy', href: '/topics/prophecy' },
      { label: 'Devotional', href: '/topics/devotional' },
    ],
  },
  {
    title: 'Articles',
    links: [
      { label: 'The Archive', href: '/articles' },
      { label: 'Doctrine', href: '/topics/doctrine' },
      { label: 'Church History', href: '/topics/church-history' },
      { label: 'Testimony', href: '/topics/testimony' },
    ],
  },
  {
    title: 'Archive',
    links: [
      { label: 'Prophecy Archive', href: '/prophecies' },
      { label: 'Search', href: '/search' },
      { label: 'RSS', href: '/feed.xml' },
    ],
  },
  {
    title: 'Media',
    links: [
      { label: 'Jesus is LORD Radio', href: radioChannel.href },
      { label: 'YouTube', href: youtubeChannel.href },
      { label: 'Share on WhatsApp', href: whatsappChannel.href },
    ],
  },
]
