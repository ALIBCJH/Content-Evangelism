import * as React from 'react'
import type { Metadata } from 'next'
import { Cross } from 'lucide-react'
import {
  authorById,
  authorHref,
  categoryBlurb,
  crossArticle,
  siteInfo,
  siteUrl,
} from '@/lib/content'
import { listRealRows, relatedRows } from '@/lib/rows'
import { absoluteUrl, rssAlternate } from '@/lib/seo'
import { headingId } from '@/lib/toc'
import { ArticleLayout } from '@/components/article-layout'
import { JsonLd } from '@/components/json-ld'

/* The teaching itself never changes; only the Read Next rail below it
   does, and every five minutes is soon enough for that. */
export const revalidate = 300

export const metadata: Metadata = {
  title: 'The Cross of Jesus: Where Repentance Meets Mercy',
  description:
    'Before it was ever an ornament, it was an execution. A teaching on the cross of Jesus — the place where the holiness of God and the hope of sinners met once and for all.',
  alternates: { canonical: '/articles/the-cross-of-jesus', types: rssAlternate },
  keywords: ['the cross of Jesus', 'repentance', 'mercy', 'Teachings', 'Ministry of Repentance and Holiness'],
  authors: [{ name: 'The Editorial Desk', url: `${siteUrl}/authors/editorial-desk` }],
  openGraph: {
    type: 'article',
    title: 'The Cross of Jesus: Where Repentance Meets Mercy',
    description:
      'A teaching on the cross of Jesus — where the holiness of God and the hope of sinners met once and for all.',
    url: '/articles/the-cross-of-jesus',
    publishedTime: crossArticle.publishedAt,
    modifiedTime: crossArticle.publishedAt,
    authors: ['The Editorial Desk'],
    section: crossArticle.category,
    images: [{ url: '/images/the-cross-of-jesus.png', width: 1155, height: 658 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Cross of Jesus: Where Repentance Meets Mercy',
    description:
      'A teaching on the cross of Jesus — where the holiness of God and the hope of sinners met once and for all.',
    images: ['/images/the-cross-of-jesus.png'],
  },
}

const crossUrl = `${siteUrl}${crossArticle.href}`
const crossAuthor = authorById(crossArticle.authorId)

const articleLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  '@id': `${crossUrl}#article`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': crossUrl },
  url: crossUrl,
  headline: crossArticle.title,
  description: crossArticle.dek,
  articleSection: crossArticle.category,
  keywords: ['the cross of Jesus', 'repentance', 'mercy', siteInfo.ministry].join(', '),
  datePublished: crossArticle.publishedAt,
  /* Undeclared, a piece looks perpetually unrevised; the published date
     stands as the last modification until the teaching is actually
     edited. */
  dateModified: crossArticle.publishedAt,
  timeRequired: `PT${crossArticle.readMinutes}M`,
  /* Unsigned, so the ministry itself carries it — the editorial desk is a
     masthead, not a person to credit. */
  author: {
    '@type': 'Organization',
    '@id': `${siteUrl}/#ministry`,
    name: siteInfo.ministry,
    url: `${siteUrl}${authorHref(crossAuthor)}`,
  },
  publisher: { '@id': `${siteUrl}/#ministry`, '@type': 'Organization', name: siteInfo.ministry },
  isPartOf: { '@id': `${siteUrl}/#website` },
  inLanguage: 'en',
  isAccessibleForFree: true,
  about: {
    '@type': 'Thing',
    name: crossArticle.category,
    description: categoryBlurb[crossArticle.category],
  },
  ...(crossArticle.image
    ? {
        image: [
          {
            '@type': 'ImageObject',
            url: absoluteUrl(crossArticle.image.src),
            contentUrl: absoluteUrl(crossArticle.image.src),
            width: crossArticle.image.width,
            height: crossArticle.image.height,
            caption: crossArticle.image.alt,
          },
        ],
        thumbnailUrl: absoluteUrl(crossArticle.image.src),
      }
    : {}),
}

/**
 * The chapters of this teaching, declared once.
 *
 * The posted articles derive their chapter list from `## ` headings in
 * the body; this piece is hand-set, so it declares the same list here and
 * the subheadings take their ids from it. One array, so the study margin
 * and the headings it links to can never drift apart.
 */
const CHAPTERS = [
  { numeral: 'I.', text: 'The Place of Exchange' },
  { numeral: 'II.', text: 'Why the Cross Calls for Repentance' },
  { numeral: 'III.', text: 'The Empty Cross and the Waiting Cloth' },
  { numeral: 'IV.', text: 'Take Up Your Own' },
]

const headings = CHAPTERS.map((chapter) => ({
  id: headingId(chapter.text),
  text: chapter.text,
}))

/** Section subheading with a small gold numeral, in the house style. */
function Subhead({ chapter }: { chapter: (typeof CHAPTERS)[number] }) {
  return (
    <h2
      id={headingId(chapter.text)}
      className="mt-14 flex scroll-mt-28 items-baseline gap-4 text-balance font-display text-[1.6rem] font-semibold leading-snug text-ink-strong md:text-[1.85rem]"
    >
      <span aria-hidden className="font-display text-xl font-semibold text-gold">
        {chapter.numeral}
      </span>
      {chapter.text}
    </h2>
  )
}

/* Running text, set to match ArticleProse exactly — the two renderers
   produce one reading experience, so they share one specification. */
function P({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`mt-7 font-serif text-[1.1875rem] leading-[1.78] text-ink text-pretty ${className}`}
    >
      {children}
    </p>
  )
}

/** Inline scripture reference, set in the house small-caps style. */
function Ref({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap font-sans text-[0.8em] font-bold uppercase tracking-kicker text-gold">
      {children}
    </span>
  )
}

export default async function CrossArticlePage() {
  const article = crossArticle
  const related = relatedRows(await listRealRows(), article.slug, article.category)

  return (
    <>
      <JsonLd data={articleLd} />
      <ArticleLayout
        category={article.category}
        title={article.title}
        dek={article.dek}
        author={{ name: crossAuthor.name, href: authorHref(crossAuthor) }}
        publishedAt={article.publishedAt}
        readMinutes={article.readMinutes}
        {...(article.image
          ? {
              hero: {
                src: article.image.src,
                alt: article.image.alt,
                caption:
                  'The cross is empty, and the cloth is left behind — the two facts on which everything rests.',
              },
            }
          : {})}
        headings={headings}
        related={related}
        colophon={
          <p className="text-center font-sans text-[0.6875rem] font-semibold uppercase tracking-kicker text-ink-subtle">
            Isaiah 53:5 · 1 Corinthians 1:18 · Galatians 6:14
          </p>
        }
      >
        <P className="dropcap !mt-0">
          Every movement in history has chosen its symbol. Empires took the eagle;
          dynasties took the lion; revolutions took the rising sun. The church of
          Jesus Christ, with all of heaven&rsquo;s imagery at her disposal, took an
          instrument of execution. It is easy to forget, after twenty centuries of
          art and architecture, how shocking that choice was. Nobody in the first
          century wore a cross around the neck. The cross was Rome&rsquo;s grim
          machinery for ending a life slowly and publicly — a warning nailed up at
          the roadside. And yet when the apostle Paul summarized his entire
          message, he did not reach for anything safer:{' '}
          <em>&ldquo;We preach Christ crucified&rdquo;</em> <Ref>1 Corinthians 1:23</Ref>.
        </P>
        <P>
          The church did not choose the cross because it was beautiful. She chose
          it because of what happened there. On a hill outside Jerusalem, on a
          Friday afternoon the world has never been able to forget, the holiness
          of God and the sin of man met in the body of one Man — and mercy walked
          away the victor.
        </P>

        <Subhead chapter={CHAPTERS[0]} />
        <P>
          Seven hundred years before that Friday, the prophet Isaiah saw it and
          wrote it down like an eyewitness: <em>&ldquo;He was pierced for our
          transgressions; He was crushed for our iniquities; upon Him was the
          chastisement that brought us peace, and with His wounds we are
          healed&rdquo;</em> <Ref>Isaiah 53:5</Ref>. Notice the pronouns — that is
          the whole gospel in grammar. Our transgressions; His piercing. Our
          iniquities; His crushing. Our peace; His chastisement. Our healing; His
          wounds.
        </P>
        <P>
          The old divines called it the great exchange. The apostle put it more
          daringly still: <em>&ldquo;For our sake He made Him to be sin who knew no
          sin, so that in Him we might become the righteousness of
          God&rdquo;</em> <Ref>2 Corinthians 5:21</Ref>. At the cross, God did not
          lower the standard of His holiness by a single degree. He satisfied it —
          in His own body, on our behalf. Justice was not suspended at Calvary; it
          was spent there.
        </P>

        {/* Pull quote */}
        <blockquote className="my-12">
          <div className="ornament mx-auto max-w-xs">
            <Cross className="h-3.5 w-3.5" strokeWidth={1.5} />
          </div>
          <p className="mt-6 text-center font-display text-2xl font-normal italic leading-snug text-ink-strong md:text-[1.7rem]">
            &ldquo;Justice was not suspended at Calvary — it was spent there.&rdquo;
          </p>
        </blockquote>

        <Subhead chapter={CHAPTERS[1]} />
        <P>
          There is a reason this ministry bears the name it does. The first sermon
          ever preached about the cross did not end in applause; it ended in a
          question. When Peter told the crowd at Pentecost what their sin had done
          and what God had done with it, Scripture records that{' '}
          <em>&ldquo;they were cut to the heart, and said&hellip; what shall we
          do?&rdquo;</em> And the answer came back like a bell:{' '}
          <em>&ldquo;Repent&rdquo;</em> <Ref>Acts 2:37–38</Ref>.
        </P>
        <P>
          The cross is not merely to be admired. It is to be answered. A man may
          stand before a painting of Calvary and feel something stir, wipe his
          eyes, and walk away unchanged — but no one can stand before the actual
          cross honestly and stay as they are. It tells us the truth about
          ourselves: sin was serious enough to require this. And it tells us the
          truth about God: we were loved enough that He would rather bear the cost
          Himself than lose us. Repentance is simply what honesty does when it
          meets that kind of mercy. It turns.
        </P>

        <Subhead chapter={CHAPTERS[2]} />
        <P>
          Look carefully at the image above this article. The cross stands against
          the breaking dawn — and it is empty. A white cloth is draped over the
          beam where a body once hung. The photograph preaches better than most of
          us: this is an instrument of death photographed at sunrise, and the only
          thing it holds now is the cloth He no longer needs.
        </P>
        <P>
          When John reached the tomb on the third morning, the detail he never
          forgot was the linen — the grave clothes lying there, and the face cloth
          folded up in a place by itself <Ref>John 20:6–7</Ref>. Death had been
          inside those wrappings, and death had been made to hand them back. The
          cross of Jesus matters because of the empty tomb behind it; Friday is
          good news only because of Sunday. We do not follow a martyr whose cause
          outlived him. We follow a living Lord who walked out of His own grave
          and left the evidence neatly folded.
        </P>

        <Subhead chapter={CHAPTERS[3]} />
        <P>
          And yet the cross is not only something done for us; it is something
          asked of us. Jesus said, <em>&ldquo;If anyone would come after Me, let
          him deny himself and take up his cross daily and follow
          Me&rdquo;</em> <Ref>Luke 9:23</Ref>. Daily — not once, in a moment of
          high feeling, but each ordinary morning: the quiet decision that His
          way outranks mine, that holiness is worth more than comfort, that the
          road He walked is the road we walk.
        </P>
        <P>
          This is what it means to prepare the way of the Lord. Not to decorate
          the cross, but to carry one. Not to admire repentance, but to practice
          it. The way to the coming King runs past Calvary — there is no detour —
          and everyone who kneels there rises lighter than they came.
        </P>
        <P>
          The cross of Jesus still stands at the center of history, and at the
          door of every heart. It has borne the worst we could do and offered back
          the best heaven has. The dawn behind it is already breaking. What
          remains is the oldest invitation in the world, and the kindest:{' '}
          <em>come</em>.
        </P>
      </ArticleLayout>
    </>
  )
}
