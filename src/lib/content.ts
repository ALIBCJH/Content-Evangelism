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

/* Articles is the whole archive at /; Teachings and Prophecies are the
   same archive filtered to one section. */
export const navSections = [
  { label: 'Articles', href: '/' },
  { label: 'Teachings', href: '/teachings' },
  { label: 'Prophecies', href: '/prophecies' },
  { label: 'About', href: '/about' },
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
