import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * The people who write here.
 *
 * The site had no concept of a person: one key everybody shared, and a
 * byline that was a box somebody typed their own name into — differently
 * each time. Nothing could say who wrote or approved anything, removing
 * one person meant changing everybody's key, and a new writer had a
 * byline with nowhere for it to lead.
 *
 * What these hold to is that a key opens exactly one desk and nothing
 * else, that the store never holds anything which opens a desk, and that
 * the four ways of presenting a wrong key are one answer rather than
 * four.
 */

let workspace: string

async function registry() {
  vi.resetModules()
  vi.stubEnv('KV_REST_API_URL', '')
  vi.stubEnv('KV_REST_API_TOKEN', '')
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
  vi.spyOn(process, 'cwd').mockReturnValue(workspace)
  return import('@/lib/writers')
}

const SIMON = {
  name: 'Simon Juma',
  role: 'Devotional Editor',
  bio: 'Writes the morning portion and the quiet columns on prayer and waiting.',
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'writers-'))
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await fs.rm(workspace, { recursive: true, force: true })
})

describe('adding somebody', () => {
  it('gives them a key that opens their own desk', async () => {
    const { addWriter, writerForKey } = await registry()
    const added = await addWriter(SIMON)
    expect(added).not.toBeNull()

    const found = await writerForKey(added!.key)
    expect(found?.name).toBe('Simon Juma')
    expect(found?.id).toBe('simon-juma')
  })

  /* An id is the address of their author page. Titles are how somebody is
     addressed rather than who they are, and /authors/rev-dr-elizabeth is
     an address that changes the day they are made a bishop. */
  it('makes an id from the name, without the title', async () => {
    const { idFor } = await registry()
    expect(idFor('Rev. Elizabeth Omondi', new Set())).toBe('elizabeth-omondi')
    expect(idFor('Dr. Joseph Mwangi', new Set())).toBe('joseph-mwangi')
    expect(idFor('Prophet Daniel Okech', new Set())).toBe('daniel-okech')
    expect(idFor('Simon Juma', new Set())).toBe('simon-juma')
  })

  it('does not give two people the same address', async () => {
    const { idFor } = await registry()
    expect(idFor('Simon Juma', new Set(['simon-juma']))).toBe('simon-juma-2')
    expect(idFor('Simon Juma', new Set(['simon-juma', 'simon-juma-2']))).toBe('simon-juma-3')
  })

  it('always yields an id, whatever the name is made of', async () => {
    const { idFor } = await registry()
    expect(idFor('!!!', new Set())).toBe('writer')
    expect(idFor('', new Set())).toBe('writer')
  })
})

describe('what the store holds', () => {
  /* The point of the whole scheme. A backup of the registry, or anybody
     who ever reads it, holds nothing that opens the desk. */
  it('never holds the key, or any part of it', async () => {
    const { addWriter } = await registry()
    const added = await addWriter(SIMON)
    const document = await fs.readFile(path.join(workspace, 'data', 'writers.json'), 'utf8')

    const secret = added!.key.split('.')[1]
    expect(document).not.toContain(secret)
    expect(document).not.toContain(added!.key)
    /* The id is in the key and is a public thing — it is in the address
       of their author page — so its presence is not a leak. */
    expect(document).toContain('simon-juma')
  })

  it('hands out nobody’s salt or hash', async () => {
    const { addWriter, listWriters, withoutSecrets } = await registry()
    await addWriter(SIMON)
    const [held] = await listWriters()
    const public_ = withoutSecrets(held) as Record<string, unknown>
    expect(public_.salt).toBeUndefined()
    expect(public_.hash).toBeUndefined()
    expect(public_.name).toBe('Simon Juma')
  })

  /* Two writers with the same key text would still hash differently, so a
     stolen registry cannot be attacked once for everybody at a time. */
  it('salts each writer separately', async () => {
    const { addWriter, listWriters } = await registry()
    await addWriter(SIMON)
    await addWriter({ ...SIMON, name: 'Mary Wanjiru' })
    const [a, b] = await listWriters()
    expect(a.salt).not.toBe(b.salt)
  })
})

describe('a key that is not theirs', () => {
  it('opens nothing', async () => {
    const { addWriter, writerForKey } = await registry()
    const added = await addWriter(SIMON)
    const [id, secret] = added!.key.split('.')

    /* Four ways of being wrong, one answer — telling them apart tells
       somebody holding a guess which half of it was right. */
    expect(await writerForKey(`${id}.wrong-secret`)).toBeNull()
    expect(await writerForKey(`nobody.${secret}`)).toBeNull()
    expect(await writerForKey(secret)).toBeNull()
    expect(await writerForKey('')).toBeNull()
  })

  it('refuses a key whose id could not be an id', async () => {
    const { splitKey } = await registry()
    expect(splitKey('Simon Juma.secret')).toBeNull()
    expect(splitKey('../../etc.secret')).toBeNull()
    expect(splitKey('.secret')).toBeNull()
    expect(splitKey('id.')).toBeNull()
    expect(splitKey('no-dot-at-all')).toBeNull()
  })

  /* The ministry's own two env keys have no dot, so they never reach the
     registry at all and a deployment that adds nobody is unaffected. */
  it('does not mistake the ministry’s own key for a writer', async () => {
    const { splitKey } = await registry()
    expect(splitKey('posting-key-aaaaaaaaaaaaaaaaaaa')).toBeNull()
  })
})

describe('a writer who has left', () => {
  it('is turned off rather than deleted', async () => {
    const { addWriter, listWriters, setActive, writerForKey } = await registry()
    const added = await addWriter(SIMON)

    await setActive('simon-juma', false)
    expect(await writerForKey(added!.key)).toBeNull()

    /* Their name is on published teachings and their page is an address
       somebody may have shared. What ends is the key. */
    const [held] = await listWriters()
    expect(held.name).toBe('Simon Juma')
    expect(held.active).toBe(false)
  })

  it('can be let back in', async () => {
    const { addWriter, setActive, writerForKey } = await registry()
    const added = await addWriter(SIMON)
    await setActive('simon-juma', false)
    await setActive('simon-juma', true)
    expect(await writerForKey(added!.key)).not.toBeNull()
  })
})

describe('a key that was lost', () => {
  it('is replaced, and the old one stops working', async () => {
    const { addWriter, newKeyFor, writerForKey } = await registry()
    const added = await addWriter(SIMON)
    const replacement = await newKeyFor('simon-juma')

    expect(replacement).not.toBe(added!.key)
    expect(await writerForKey(replacement!)).not.toBeNull()
    expect(await writerForKey(added!.key)).toBeNull()
  })

  it('is not minted for somebody who does not exist', async () => {
    const { newKeyFor } = await registry()
    expect(await newKeyFor('nobody')).toBeNull()
  })
})

describe('what the site says about a writer', () => {
  /* The same rule as a teaching: a writer may write what the site says
     about them, and somebody else decides whether it is published under
     the ministry's name. */
  it('waits for the review desk before it is on the site', async () => {
    const { addWriter, listWriters, proposeProfile } = await registry()
    await addWriter(SIMON)
    await proposeProfile('simon-juma', { role: 'Senior Editor', bio: 'A longer account of the work.' })

    const [held] = await listWriters()
    expect(held.role).toBe('Devotional Editor')
    expect(held.pendingProfile?.role).toBe('Senior Editor')
  })

  it('goes on the page when it is approved', async () => {
    const { addWriter, decideProfile, listWriters, proposeProfile } = await registry()
    await addWriter(SIMON)
    await proposeProfile('simon-juma', { role: 'Senior Editor', bio: 'A longer account of the work.' })
    await decideProfile('simon-juma', true)

    const [held] = await listWriters()
    expect(held.role).toBe('Senior Editor')
    expect(held.bio).toBe('A longer account of the work.')
    expect(held.pendingProfile).toBeUndefined()
  })

  it('leaves the page alone when it is refused, and stops waiting', async () => {
    const { addWriter, decideProfile, listWriters, proposeProfile } = await registry()
    await addWriter(SIMON)
    await proposeProfile('simon-juma', { role: 'Senior Editor', bio: 'A longer account of the work.' })
    await decideProfile('simon-juma', false)

    const [held] = await listWriters()
    expect(held.role).toBe('Devotional Editor')
    expect(held.pendingProfile).toBeUndefined()
  })

  it('checks what is worth publishing before it accepts it', async () => {
    const { validateWriter } = await registry()
    expect(validateWriter({ name: 'S', role: 'Editor', bio: SIMON.bio }).error).toBeTruthy()
    expect(validateWriter({ name: 'Simon Juma', role: '', bio: SIMON.bio }).error).toBeTruthy()
    /* A one-line bio is not worth an author page, and an author page is
       most of what a search engine reads to decide a byline is real. */
    expect(validateWriter({ name: 'Simon Juma', role: 'Editor', bio: 'Writes.' }).error).toBeTruthy()
    expect(validateWriter({ ...SIMON }).input?.name).toBe('Simon Juma')
  })

  it('does not hand out approval by accident', async () => {
    const { validateWriter } = await registry()
    expect(validateWriter({ ...SIMON }).input?.canReview).toBe(false)
    expect(validateWriter({ ...SIMON, canReview: 'yes' }).input?.canReview).toBe(false)
    expect(validateWriter({ ...SIMON, canReview: true }).input?.canReview).toBe(true)
  })
})

describe('a deployment with no register', () => {
  /* The ordinary state of a site that has not added anybody. Its env keys
     still open the desk; nothing here throws on the way to saying so. */
  it('reads as empty rather than failing', async () => {
    const { listWriters, writerForKey } = await registry()
    expect(await listWriters()).toEqual([])
    expect(await writerForKey('anything.at-all')).toBeNull()
  })

  it('treats an unreadable register as empty', async () => {
    await fs.mkdir(path.join(workspace, 'data'), { recursive: true })
    await fs.writeFile(path.join(workspace, 'data', 'writers.json'), 'not json', 'utf8')
    const { listWriters } = await registry()
    expect(await listWriters()).toEqual([])
  })
})
