import { describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'

/**
 * Which theme a reader is given on arrival.
 *
 * The site followed the operating system when nothing was stored, which is
 * the usual advice and the wrong answer for a publication: a machine kept
 * dark for a terminal at night is not a statement about how somebody wants
 * to read a teaching, and it was being read as one. A reader who had never
 * expressed a preference here was shown a version of the site they had not
 * asked for, and had to find a control to see the one they had.
 *
 * So light on arrival, whatever the machine says, and dark the moment a
 * reader presses for it — remembered for good, and never overruled.
 *
 * The decision is made in three places and they must agree, because a
 * disagreement between them is a flash of the wrong theme or a toggle
 * showing a sun over a dark page. These read the three as they ship.
 */

const read = (relative: string) => fs.readFile(path.join(process.cwd(), relative), 'utf8')

/**
 * The script the root layout puts in the head, run against a browser this
 * test invents. It is a string in a template literal rather than a module,
 * so the only honest way to test it is to run the thing that ships.
 */
async function decide(stored: string | null, systemPrefersDark: boolean): Promise<string> {
  const layout = await read('src/app/layout.tsx')
  const source = layout.match(/const themeScript = `([^`]*)`/)?.[1]
  expect(source, 'themeScript should still be a template literal in layout.tsx').toBeTruthy()

  const documentElement = { dataset: {} as Record<string, string> }
  new Function(
    'localStorage',
    'document',
    'matchMedia',
    source!
  )(
    { getItem: () => stored },
    { documentElement },
    () => ({ matches: systemPrefersDark })
  )
  return documentElement.dataset.theme
}

describe('the theme a reader arrives on', () => {
  it('is light when they have chosen nothing, on a machine set to light', async () => {
    expect(await decide(null, false)).toBe('light')
  })

  it('is light when they have chosen nothing, on a machine set to dark', async () => {
    /* The whole change. The operating system does not decide what a
       publication looks like on first opening. */
    expect(await decide(null, true)).toBe('light')
  })

  it('is dark when they have pressed for dark, on a machine set to light', async () => {
    expect(await decide('dark', false)).toBe('dark')
  })

  it('is dark when they have pressed for dark, whatever the machine says', async () => {
    expect(await decide('dark', true)).toBe('dark')
  })

  it('is light when they have pressed for light', async () => {
    expect(await decide('light', true)).toBe('light')
  })

  it('is light when the stored value is nonsense', async () => {
    for (const rubbish of ['', 'DARK', 'true', '{}', 'auto', 'system']) {
      expect(await decide(rubbish, true), rubbish).toBe('light')
    }
  })

  it('is light when storage throws, which is a browser with it blocked', async () => {
    const layout = await read('src/app/layout.tsx')
    const source = layout.match(/const themeScript = `([^`]*)`/)![1]
    const documentElement = { dataset: {} as Record<string, string> }

    expect(() =>
      new Function('localStorage', 'document', 'matchMedia', source)(
        {
          getItem() {
            throw new Error('storage blocked')
          },
        },
        { documentElement },
        () => ({ matches: true })
      )
    ).not.toThrow()

    /* Unset, and unset is light: :root alone declares the light theme, and
       nothing else applies without the attribute saying 'dark'. */
    expect(documentElement.dataset.theme).toBeUndefined()
  })
})

describe('the stylesheet', () => {
  it('applies the dark theme only when the attribute asks for it', async () => {
    const css = await read('src/app/globals.css')
    expect(css).toContain("[data-theme='dark']")
  })

  it('no longer takes the dark theme from the operating system', async () => {
    /* The fallback under [data-theme='dark'] used to be
       `@media (prefers-color-scheme: dark)`, which would have kept handing
       a dark page to a reader with JavaScript off however the script above
       was written. Its absence is the other half of the change. */
    const css = await read('src/app/globals.css')
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(rules).not.toContain('prefers-color-scheme')
  })

  it('still declares the light theme on :root alone, which is the default', async () => {
    const css = await read('src/app/globals.css')
    expect(css).toMatch(/:root\s*\{[\s\S]*?color-scheme:\s*light/)
  })
})

describe('the toggle', () => {
  it('does not watch the operating system any more', async () => {
    /* A reader who has expressed no preference is on light deliberately.
       A change made in the OS while the page is open must not move them. */
    const toggle = await read('src/components/theme-toggle.tsx')
    expect(toggle).not.toContain('matchMedia')
    expect(toggle).not.toContain('addEventListener')
  })

  it('reads a stored choice the same way the stamping script does', async () => {
    /* If these two disagreed, the button would show a sun over a dark page
       — or the page would flash the other theme as React caught up. */
    const toggle = await read('src/components/theme-toggle.tsx')
    expect(toggle).toContain("=== 'dark' ? 'dark' : 'light'")
  })
})

describe('the browser chrome around the page', () => {
  it('is the light ground, not a pair keyed on the system preference', async () => {
    /* A pair would put dark chrome around a light page on a machine kept
       dark, which is the mismatch the pair used to avoid and would now
       cause. */
    const layout = await read('src/app/layout.tsx')
    expect(layout).toContain("themeColor: '#123B5D'")
    expect(layout).not.toContain("media: '(prefers-color-scheme: dark)'")
  })

  it('follows a reader who chooses dark', async () => {
    const toggle = await read('src/components/theme-toggle.tsx')
    expect(toggle).toContain('meta[name="theme-color"]')
    expect(toggle).toContain('#0A1A2F')
  })
})
