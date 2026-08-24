import { NextResponse } from 'next/server'
import { canReview, deskToken, listPostedArticles } from '@/lib/posted'
import { listQuestions } from '@/lib/questions'
import { readInsight, readInsightRange } from '@/lib/insight'
import { counties } from '@/lib/content'
import { locatedCounties } from '@/lib/altars'
import {
  byPart,
  clickTotals,
  deadEnds,
  healthNotes,
  needsAttention,
  pieceRows,
  summarise,
  unread,
  type DeskHealth,
} from '@/lib/desk-overview'

/**
 * Everything the review desk's board shows, in one answer.
 *
 * Four separate things — the queue, the questions, the counters and the
 * state of the machinery — used to be four fetches from three pages, and
 * a board assembled in the browser out of four loading states is a board
 * that flickers into place a piece at a time. They are joined here
 * instead, where the data already is.
 *
 * Review key only. This is the whole of what the ministry knows about how
 * it is read, next to every reader's question; the posting key writes,
 * and this is not writing.
 */
export const dynamic = 'force-dynamic'

/** The stretch being reported on, and the one it is compared against. */
const DEFAULT_DAYS = 30
const MAX_DAYS = 90

export async function GET(request: Request) {
  const token = await deskToken(request)
  if (!canReview(token)) {
    return NextResponse.json({ error: 'Invalid review key.' }, { status: 401 })
  }

  const asked = Number(new URL(request.url).searchParams.get('days'))
  const days = Number.isFinite(asked) && asked > 0 ? Math.min(Math.floor(asked), MAX_DAYS) : DEFAULT_DAYS

  const now = Date.now()
  /* The window before this one, ending the day this one began, so the
     comparison is like against like rather than against everything. */
  const previousEnd = now - days * 86_400_000

  const [articles, questionQueue, ever, current, previous] = await Promise.all([
    listPostedArticles({ includePending: true }),
    listQuestions(token),
    readInsight(),
    readInsightRange(days, now),
    readInsightRange(days, previousEnd),
  ])

  const questions = questionQueue.questions ?? []
  const rows = pieceRows(articles, current.pages, ever)

  const health: DeskHealth = {
    storeAttached: Boolean(
      process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
    ),
    /* Set and different. A REVIEW_TOKEN that merely repeats the posting
       key is the fallback wearing a second name, and reporting it as
       separation would be worse than reporting nothing. */
    separateReviewKey: Boolean(
      process.env.REVIEW_TOKEN && process.env.REVIEW_TOKEN !== process.env.ADMIN_TOKEN
    ),
    countingWorks: ever.some((page) => page.views > 0),
    live: articles.filter((article) => article.status !== 'pending').length,
    pending: articles.filter((article) => article.status === 'pending').length,
    altarsPlaced: locatedCounties.length,
    countiesTotal: counties.length,
    lastPublishedAt: articles
      .filter((article) => article.status !== 'pending')
      .map((article) => article.publishedAt)
      .sort()
      .at(-1),
  }

  return NextResponse.json({
    days,
    needs: needsAttention(articles, questions),
    summary: summarise(current.series, previous.series),
    series: current.series,
    pieces: rows,
    deadEnds: deadEnds(rows).slice(0, 8),
    unread: unread(rows).slice(0, 8),
    parts: byPart(current.pages),
    clicks: clickTotals(current.pages),
    health,
    healthNotes: healthNotes(health),
  })
}
