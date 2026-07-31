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

/** URL slug + section description for every category page. */
export const categoryMeta: Record<Category, { slug: string; description: string }> = {
  Teachings: {
    slug: 'teachings',
    description: 'Expositions and sermons — the Scriptures opened for the church.',
  },
  Prophecy: {
    slug: 'prophecy',
    description: 'Reading the times with sobriety — every word weighed and tested.',
  },
  Oracles: {
    slug: 'oracles',
    description: 'Words delivered at the altar — recorded, dated, and kept for the congregation.',
  },
  Devotional: {
    slug: 'devotional',
    description: 'Quiet columns for the daily walk: prayer, waiting, and hope.',
  },
  Doctrine: {
    slug: 'doctrine',
    description: 'The creeds, the covenants, and the character of God.',
  },
  'Church History': {
    slug: 'church-history',
    description: 'Two thousand years of the church, told as if it happened yesterday.',
  },
  Testimony: {
    slug: 'testimony',
    description: 'The congregation’s record of God’s faithfulness.',
  },
}

export function categoryFromSlug(slug: string): Category | null {
  const match = (Object.entries(categoryMeta) as [Category, { slug: string }][]).find(
    ([, meta]) => meta.slug === slug
  )
  return match ? match[0] : null
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

export interface Series {
  slug: string
  title: string
  description: string
  parts: number
  partsPublished: number
  art: ArticleArt
}

export interface StudyGuide {
  slug: string
  title: string
  description: string
  sessions: number
  level: 'Foundations' | 'Growing' | 'Deep Study'
  scripture: string
  art: ArticleArt
}

export interface ProphecyEntry {
  numeral: string
  title: string
  excerpt: string
  delivered: string
  theme: 'The Nations' | 'The Church' | 'The Harvest' | 'The Return'
  scripture: string
}

export interface Oracle {
  kicker: string
  title: string
  excerpt: string
  scripture: string
  authorId: string
  publishedAt: string
  readMinutes: number
}

export interface Topic {
  name: string
  count: number
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

/* ── Featured Oracle ─────────────────────────────────────────────── */

export const featuredOracle: Oracle = {
  kicker: 'The Featured Oracle',
  title: 'A Word Concerning the Scattered: He Is Gathering What the Years Have Driven Apart',
  excerpt:
    'The Lord would say to His church: what you have called delay, I have called preparation. The scattering you grieved was a sowing — and the fields you wept over are white unto harvest. Lift your eyes; I am gathering the far-off and the forgotten, and the house will be fuller than before.',
  scripture: 'Isaiah 54:7 · John 4:35',
  authorId: 'd-okech',
  publishedAt: '2026-07-26',
  readMinutes: 9,
}

/* ── Articles ────────────────────────────────────────────────────── */

export const articles: Article[] = [
  {
    slug: 'discipline-of-waiting',
    title: 'The Discipline of Waiting: What the Psalms Teach About God’s Silence',
    dek: 'Between the promise and its fulfilment lies a country the Psalmists knew well — a land of unanswered letters and long silences, where heaven seems to hold its breath. Yet the psalms refuse to treat that silence as absence. Again and again they teach the church to wait the way watchmen wait for the morning: eyes open, honest about the ache, and quietly certain that dawn is already on its way. Learning to wait, they insist, is not passivity. It is the church’s oldest act of defiance against despair.',
    category: 'Teachings',
    authorId: 'e-omondi',
    publishedAt: '2026-07-30',
    readMinutes: 12,
    art: { palette: 'midnight', icon: 'lamp' },
  },
  {
    slug: 'bread-in-the-wilderness',
    title: 'Bread in the Wilderness: Manna and the Economics of Trust',
    dek: 'Enough for today, nothing for the barn. What Israel’s daily bread teaches a generation that stores everything and trusts nothing.',
    category: 'Teachings',
    authorId: 'e-omondi',
    publishedAt: '2026-07-29',
    readMinutes: 9,
    art: { palette: 'harvest', icon: 'wheat' },
  },
  {
    slug: 'creeds-still-speak',
    title: 'Why the Creeds Still Speak: Nicaea at Seventeen Hundred',
    dek: 'Seventeen centuries on, the old confession remains the church’s sharpest instrument against every comfortable half-truth.',
    category: 'Doctrine',
    authorId: 'j-mwangi',
    publishedAt: '2026-07-28',
    readMinutes: 14,
    art: { palette: 'wine', icon: 'book' },
  },
  {
    slug: 'anatomy-of-a-blessing',
    title: 'The Anatomy of a Blessing: What Happens When the Church Lifts Its Hands',
    dek: 'The benediction is not a polite goodbye. Tracing the priestly blessing from Aaron’s tent to Sunday’s last minute.',
    category: 'Doctrine',
    authorId: 'j-mwangi',
    publishedAt: '2026-07-27',
    readMinutes: 11,
    art: { palette: 'dawn', icon: 'sunrise' },
  },
  {
    slug: 'praying-the-hours',
    title: 'Praying the Hours: A Beginner’s Rule for an Interrupted Life',
    dek: 'You do not need a monastery. You need a morning, a midday, and an evening — and the stubbornness to keep them.',
    category: 'Devotional',
    authorId: 'm-carvalho',
    publishedAt: '2026-07-27',
    readMinutes: 7,
    art: { palette: 'flame', icon: 'flame' },
  },
  {
    slug: 'watchmen-not-alarmists',
    title: 'Watchmen, Not Alarmists: Reading the Times Without Losing Your Head',
    dek: 'Prophecy was given to steady the church, not to sell it panic. How to test a word, weigh a season, and keep your lamp lit.',
    category: 'Prophecy',
    authorId: 'd-okech',
    publishedAt: '2026-07-26',
    readMinutes: 13,
    art: { palette: 'orchid', icon: 'trumpet' },
  },
  {
    slug: 'wells-our-fathers-dug',
    title: 'The Wells Our Fathers Dug: Recovering the East African Revival',
    dek: 'Eighty years before the megachurch, a small fellowship in the highlands learned to walk in the light. Its questions are still ours.',
    category: 'Church History',
    authorId: 's-njeri',
    publishedAt: '2026-07-25',
    readMinutes: 16,
    art: { palette: 'olive', icon: 'well' },
  },
  {
    slug: 'testimony-nairobi-nights',
    title: 'Testimony: The Prayer Meeting That Would Not End',
    dek: 'It was scheduled for one hour. It lasted three years. Members recall the season that quietly remade a congregation.',
    category: 'Testimony',
    authorId: 's-njeri',
    publishedAt: '2026-07-24',
    readMinutes: 8,
    art: { palette: 'flame', icon: 'star' },
  },
  {
    slug: 'shepherds-and-platforms',
    title: 'Shepherds and Platforms: Recovering the Quiet Office of Pastor',
    dek: 'The microphone is new; the mandate is ancient. What Ezekiel 34 says to an age of celebrity ministry.',
    category: 'Teachings',
    authorId: 'e-omondi',
    publishedAt: '2026-07-23',
    readMinutes: 10,
    art: { palette: 'olive', icon: 'shepherd' },
  },
  {
    slug: 'hope-is-a-discipline',
    title: 'Hope Is a Discipline: An Anchor, Not a Mood',
    dek: 'Biblical hope is not optimism with a verse attached. It is a practice — and like all practices, it can be learned.',
    category: 'Devotional',
    authorId: 'm-carvalho',
    publishedAt: '2026-07-22',
    readMinutes: 6,
    art: { palette: 'dawn', icon: 'anchor' },
  },
]

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

/* Curation for the landing page. */
export const leadStory = crossArticle
export const latestTeachings = [articles[1], articles[3], articles[4], articles[8]]
export const recentArticles = articles.slice(1, 9)
export const mostRead = [articles[5], articles[0], articles[4], articles[6], articles[9]]

/* ── Today's Verse ───────────────────────────────────────────────── */

export const todaysVerse = {
  reference: 'Isaiah 55:10–11',
  translation: 'ESV',
  text: 'As the rain and the snow come down from heaven and do not return there but water the earth, making it bring forth and sprout … so shall my word be that goes out from my mouth; it shall not return to me empty.',
  reflection: 'The Word always finishes its errand.',
}

/* ── Series ──────────────────────────────────────────────────────── */

export const series: Series[] = [
  {
    slug: 'names-of-god',
    title: 'The Names of God',
    description: 'Twelve names, one character. From El Roi, the God who sees, to Jehovah Shalom, the Lord our peace.',
    parts: 12,
    partsPublished: 9,
    art: { palette: 'dawn', icon: 'crown' },
  },
  {
    slug: 'kingdom-parables',
    title: 'Kingdom Parables',
    description: 'Seed, soil, yeast, and pearls — the stories Jesus told about a kingdom that grows in secret.',
    parts: 8,
    partsPublished: 8,
    art: { palette: 'olive', icon: 'vine' },
  },
  {
    slug: 'minor-prophets',
    title: 'The Minor Prophets',
    description: 'Twelve small books with enormous voices. Justice, mercy, and the stubborn love of God.',
    parts: 12,
    partsPublished: 5,
    art: { palette: 'orchid', icon: 'scroll' },
  },
  {
    slug: 'prayers-of-the-bible',
    title: 'Prayers of the Bible',
    description: 'From Hannah’s weeping to Paul’s doxologies — praying Scripture’s own prayers until they become ours.',
    parts: 10,
    partsPublished: 10,
    art: { palette: 'flame', icon: 'flame' },
  },
  {
    slug: 'sermon-on-the-mount',
    title: 'The Sermon on the Mount',
    description: 'The manifesto of the kingdom, taken slowly — one hard, bright saying at a time.',
    parts: 14,
    partsPublished: 3,
    art: { palette: 'midnight', icon: 'mountain' },
  },
]

/* ── Study Guides ────────────────────────────────────────────────── */

export const studyGuides: StudyGuide[] = [
  {
    slug: 'foundations-of-faith',
    title: 'Foundations of Faith',
    description: 'Eight sessions for new believers: the gospel, prayer, Scripture, church, and walking in grace.',
    sessions: 8,
    level: 'Foundations',
    scripture: 'Hebrews 6:1–2',
    art: { palette: 'dawn', icon: 'compass' },
  },
  {
    slug: 'gospel-of-john',
    title: 'The Gospel of John',
    description: 'Twenty-one chapters, twenty-one evenings. Signs, glory, and the Word made flesh — with group questions.',
    sessions: 21,
    level: 'Growing',
    scripture: 'John 20:31',
    art: { palette: 'flame', icon: 'book' },
  },
  {
    slug: 'walking-through-romans',
    title: 'Walking Through Romans',
    description: 'A sixteen-week deep study of the gospel’s grand argument, from ruin to righteousness to Romans 12 living.',
    sessions: 16,
    level: 'Deep Study',
    scripture: 'Romans 1:16–17',
    art: { palette: 'wine', icon: 'scroll' },
  },
]

/* ── Prophecy Collection ─────────────────────────────────────────── */

export const prophecyCollection: ProphecyEntry[] = [
  {
    numeral: 'XXVII',
    title: 'Concerning the Scattered',
    excerpt: 'What you have called delay, I have called preparation — the house will be fuller than before.',
    delivered: '2026-07-26',
    theme: 'The Harvest',
    scripture: 'Isaiah 54:7',
  },
  {
    numeral: 'XXVI',
    title: 'To the Church That Grew Tired',
    excerpt: 'I have not measured you by your momentum. Return to the first works, and I will trim the lamp myself.',
    delivered: '2026-05-11',
    theme: 'The Church',
    scripture: 'Revelation 2:4–5',
  },
  {
    numeral: 'XXV',
    title: 'A Word Over the Cities',
    excerpt: 'The cities are not too loud for Me. I planted wells under their streets before their founders named them.',
    delivered: '2026-02-08',
    theme: 'The Nations',
    scripture: 'Jeremiah 29:7',
  },
  {
    numeral: 'XXIV',
    title: 'The Lamps and the Long Night',
    excerpt: 'Do not envy the sprinters. I am training a people who can carry oil through the long night.',
    delivered: '2025-11-30',
    theme: 'The Return',
    scripture: 'Matthew 25:4',
  },
]

/* ── Topics ──────────────────────────────────────────────────────── */

export const topics: Topic[] = [
  { name: 'Prayer', count: 128 },
  { name: 'The Kingdom', count: 96 },
  { name: 'Prophecy', count: 87 },
  { name: 'Grace', count: 82 },
  { name: 'The Psalms', count: 74 },
  { name: 'Revival', count: 69 },
  { name: 'Holiness', count: 61 },
  { name: 'The Cross', count: 58 },
  { name: 'Wisdom', count: 52 },
  { name: 'End Times', count: 47 },
  { name: 'Fasting', count: 38 },
  { name: 'Worship', count: 35 },
]

/* ── Site chrome ─────────────────────────────────────────────────── */

export const navSections = [
  { label: 'Articles', href: '/articles' },
  { label: 'Oracles', href: '/category/oracles' },
  { label: 'Teaching', href: '/category/teachings' },
  { label: 'Prophecy', href: '/category/prophecy' },
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
