import * as React from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Cross } from 'lucide-react'
import { authorById, crossArticle, siteInfo, siteUrl } from '@/lib/content'
import { listRealRows } from '@/lib/rows'
import { ArticleGate } from '@/components/article-gate'
import { JsonLd } from '@/components/json-ld'
import { Badge } from '@/components/ui/badge'
import { Byline } from '@/components/byline'
import { FadeIn } from '@/components/motion'
import { ReadingProgress } from '@/components/progress-bar'
import { ReadNext } from '@/components/read-next'
import { ShareRow } from '@/components/share-row'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Cross of Jesus: Where Repentance Meets Mercy',
  description:
    'Before it was ever an ornament, it was an execution. A teaching on the cross of Jesus — the place where the holiness of God and the hope of sinners met once and for all.',
  alternates: { canonical: '/articles/the-cross-of-jesus' },
  openGraph: {
    type: 'article',
    title: 'The Cross of Jesus: Where Repentance Meets Mercy',
    description:
      'A teaching on the cross of Jesus — where the holiness of God and the hope of sinners met once and for all.',
    url: '/articles/the-cross-of-jesus',
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

const articleLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  '@id': `${siteUrl}${crossArticle.href}`,
  mainEntityOfPage: `${siteUrl}${crossArticle.href}`,
  headline: crossArticle.title,
  description: crossArticle.dek,
  articleSection: crossArticle.category,
  datePublished: crossArticle.publishedAt,
  author: { '@type': 'Organization', name: authorById(crossArticle.authorId).name },
  publisher: { '@id': `${siteUrl}/#ministry`, '@type': 'Organization', name: siteInfo.ministry },
  isPartOf: { '@id': `${siteUrl}/#website` },
  inLanguage: 'en',
  ...(crossArticle.image ? { image: [`${siteUrl}${crossArticle.image.src}`] } : {}),
}

/** Section subheading with a small gold numeral, in the house style. */
function Subhead({ numeral, children }: { numeral: string; children: React.ReactNode }) {
  return (
    <h2 className="mt-14 flex items-baseline gap-4 font-display text-2xl font-semibold leading-snug text-ink-strong md:text-3xl">
      <span aria-hidden className="font-display text-xl font-semibold text-gold">
        {numeral}
      </span>
      {children}
    </h2>
  )
}

function P({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mt-6 font-serif text-lg leading-[1.85] text-ink-muted ${className}`}>
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
  const readNext = (await listRealRows())
    .filter((row) => row.slug !== article.slug)
    .slice(0, 3)
  return (
    <>
      <JsonLd data={articleLd} />
      <ReadingProgress />
      <main>
        <article className="cloth mx-auto my-6 max-w-3xl px-5 pb-16 pt-10 sm:px-10 md:my-10 md:pb-20">
          {/* ── Standfirst ─────────────────────────────────────── */}
          <FadeIn>
            <header className="text-center">
              <Badge variant="gold" size="sm">{article.category}</Badge>
              <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink-strong md:text-5xl">
                {article.title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl font-serif text-lg italic leading-relaxed text-ink-muted">
                {article.dek}
              </p>
              <div className="mt-7 flex justify-center">
                <Byline
                  authorId={article.authorId}
                  publishedAt={article.publishedAt}
                  readMinutes={article.readMinutes}
                />
              </div>
              <ShareRow title={article.title} className="mt-6" />
            </header>

            {/* ── The photograph ───────────────────────────────── */}
            <figure className="mt-10">
              {article.image && (
                <Image
                  src={article.image.src}
                  alt={article.image.alt}
                  width={article.image.width}
                  height={article.image.height}
                  priority
                  sizes="(min-width: 768px) 48rem, 100vw"
                  className="w-full rounded-sm border border-hairline"
                />
              )}
              <figcaption className="mt-3 text-center font-sans text-xs text-ink-subtle">
                The cross is empty, and the cloth is left behind — the two facts on which everything rests.
              </figcaption>
            </figure>
          </FadeIn>

          {/* ── Body ───────────────────────────────────────────── */}
          <FadeIn>
            <div className="mx-auto mt-12 max-w-2xl">
              <ArticleGate>
              <P className="dropcap">
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

              <Subhead numeral="I.">The Place of Exchange</Subhead>
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
                <p className="mt-6 text-center font-display text-2xl font-medium italic leading-snug text-ink-strong md:text-[1.7rem]">
                  &ldquo;Justice was not suspended at Calvary — it was spent there.&rdquo;
                </p>
              </blockquote>

              <Subhead numeral="II.">Why the Cross Calls for Repentance</Subhead>
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

              <Subhead numeral="III.">The Empty Cross and the Waiting Cloth</Subhead>
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

              <Subhead numeral="IV.">Take Up Your Own</Subhead>
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
              </ArticleGate>

              {/* ── Close ──────────────────────────────────────── */}
              <div className="mt-14 border-t border-hairline pt-8">
                <p className="text-center font-sans text-[0.6875rem] font-bold uppercase tracking-kicker text-ink-subtle">
                  Isaiah 53:5 · 1 Corinthians 1:18 · Galatians 6:14
                </p>
                <div className="ornament mx-auto mt-8 max-w-xs">
                  <Cross className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <ShareRow title={article.title} className="mt-8" />
                <div className="mt-10 flex justify-center">
                  <Link
                    href="/"
                    className="group inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-kicker text-ink-muted transition-colors hover:text-gold"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                    Back to the front page
                  </Link>
                </div>
              </div>

              <ReadNext rows={readNext} />
            </div>
          </FadeIn>
        </article>
      </main>
    </>
  )
}
