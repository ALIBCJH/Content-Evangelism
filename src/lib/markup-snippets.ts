/**
 * The openers of the body grammar, as things a writer can press.
 *
 * Each is the exact text the parser reads, split at the point the cursor
 * should land: what goes before the writing and what follows it. They are
 * kept here rather than in the editor so a test can put every one of them
 * through `parseBody` and fail if the desk's buttons ever stop producing
 * the blocks they are named after.
 *
 * `before` and `after` are two fields rather than one string with a mark
 * in it, because half of this grammar is built out of pipes and the mark
 * would have been ambiguous with the syntax.
 */

export interface Snippet {
  /** What the button says. */
  label: string
  /** What it is, for the button's title. */
  title: string
  before: string
  after: string
  /**
   * The block this produces, for the test that keeps the two honest, with
   * what to type at the cursor to make it a real one.
   */
  produces?: { kind: string; sample: string }
}

export const SNIPPETS: Snippet[] = [
  {
    label: '##',
    title: 'Chapter heading',
    before: '## ',
    after: '\n\n',
    produces: { kind: 'heading', sample: 'What is the prosperity gospel?' },
  },
  {
    label: '"',
    title: 'Quoted Scripture, with its reference',
    before: '> ',
    after: '\n> — Isaiah 40:3\n\n',
    produces: { kind: 'quote', sample: 'Prepare ye the way of the LORD' },
  },
  {
    label: '•',
    title: 'A list',
    before: '- ',
    /* One bullet, not two. A second empty one is trimmed to a bare
       hyphen, which fails the parser's bullet rule — and a list with an
       unfinished item in it is silently published as a paragraph. */
    after: '\n',
    produces: { kind: 'list', sample: 'The first thing' },
  },
  {
    label: 'link',
    title: 'A link to another teaching',
    before: '[',
    after: '](/articles/)',
  },
  { label: 'bold', title: 'Bold', before: '**', after: '**' },
  {
    label: 'table',
    title: 'Two columns, compared',
    before: '|+ ',
    after: '\n| | The rapture | The second coming\n| Where He meets us | In the air | On the earth\n\n',
    produces: { kind: 'table', sample: 'How Scripture describes each' },
  },
  {
    label: '::',
    title: 'A labelled panel — statement, source or note',
    before: '::statement ',
    after: '\n:: The text of the statement.\n:: — Ministry of Repentance and Holiness\n\n',
    produces: { kind: 'callout', sample: "From the ministry's statement of faith" },
  },
  {
    label: '@video',
    title: 'A recording, set into the teaching',
    before: '@video ',
    after: ' | The title | Prophet Dr. David Edward Owuor | Watch\n\n',
    produces: { kind: 'video', sample: '29PZpK0CKts' },
  },
  {
    label: '@figure',
    title: 'A photograph this site serves',
    before: '@figure /images/',
    after: ' 1600x900 | What it shows | A caption\n\n',
    produces: { kind: 'figure', sample: 'articles/the-cross.jpg' },
  },
  {
    label: '@related',
    title: 'Other teachings, set into the middle of this one',
    before: '@related ',
    after: '\n\n',
    produces: { kind: 'related', sample: 'what-is-repentance-and-holiness' },
  },
  {
    label: '??',
    title: 'A question this teaching answers',
    before: '?? ',
    after: '\n?: The answer.\n\n',
    produces: { kind: 'faq', sample: 'Is the rapture before the tribulation?' },
  },
]

/**
 * A snippet put in at the cursor, keeping whatever was selected inside it.
 *
 * Returns the whole new text and where the cursor belongs — after the
 * opener and after anything that was already selected, which is where a
 * writer carries on from.
 */
export function applySnippet(
  value: string,
  start: number,
  end: number,
  snippet: Pick<Snippet, 'before' | 'after'>
): { text: string; caret: number } {
  const selected = value.slice(start, end)
  const text = `${value.slice(0, start)}${snippet.before}${selected}${snippet.after}${value.slice(end)}`
  return { text, caret: start + snippet.before.length + selected.length }
}

/** The whole grammar, for the reference panel. */
export const GRAMMAR: { what: string; how: string }[] = [
  { what: 'Paragraph', how: 'A blank line between them.' },
  { what: 'Chapter', how: '## The heading' },
  { what: 'Scripture', how: '> The verse\n> — Isaiah 40:3' },
  { what: 'List', how: '- an item      1. or numbered' },
  { what: 'Link', how: '[the rapture](/articles/what-is-the-rapture-of-the-church)' },
  { what: 'Emphasis', how: '*italic*   **bold**' },
  { what: 'Table', how: '|+ Optional caption\n| | Column | Column\n| Row | cell | cell' },
  {
    what: 'Panel',
    how: '::statement A label\n:: The text\n:: — Attribution\n\n(also ::note and ::source)',
  },
  {
    what: 'Recording',
    how: '@video ID | Title | Byline | Eyebrow\n@video wide ID | … for a landscape sermon',
  },
  { what: 'Photograph', how: '@figure /images/x.jpg 1600x900 | Alt text | Caption' },
  { what: 'Drawing', how: '@diagram prophetic-timeline | A caption' },
  { what: 'Read alongside', how: '@related slug | another-slug' },
  { what: 'Question', how: '?? The question\n?: The answer' },
]
