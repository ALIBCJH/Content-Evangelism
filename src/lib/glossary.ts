/**
 * The technical terms a reader is allowed not to know.
 *
 * This site publishes one page about twenty years of laboratory work, and
 * that page's whole argument is that the record can be checked. A reader
 * cannot check what they cannot read: "the Nrf2 transcription factor and
 * the antioxidant response element" is an unbroken wall to almost
 * everybody, and a reader who meets three of those in a paragraph stops
 * reading and takes the claim on trust — which is the opposite of what
 * the page is for.
 *
 * So the terms explain themselves where they stand. Not a link out to an
 * encyclopedia, which costs the reader their place on the page and hands
 * them a page written for specialists; two or three sentences of plain
 * English, in the ministry's own words, at the point of need.
 *
 * Every definition here is ordinary textbook biology, stated without
 * reference to any claim this ministry makes. That is deliberate: the
 * explanation of what a kinase is must be the same whoever is reading it,
 * or the page is arguing rather than informing.
 */

export interface GlossaryEntry {
  /** The term as a heading — expanded where the body uses an initialism. */
  term: string
  /** Two or three sentences. Plain English, no second technical term. */
  gloss: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  'peer-reviewed': {
    term: 'Peer review',
    gloss:
      'Before a scientific paper is published, other specialists in the same field examine the method and the conclusions. They can demand changes or reject it outright, and they are not chosen by the author. It is the reason a published paper is a matter of record rather than a claim.',
  },
  'signal-transduction': {
    term: 'Signal transduction',
    gloss:
      'How a cell turns a message arriving at its surface into action inside it — a relay of proteins switching one another on until the cell changes what it is doing. Much of cancer biology is the study of relays that have become stuck in the on position.',
  },
  mapk: {
    term: 'Mitogen-activated protein kinase (MAPK)',
    gloss:
      'A family of relay enzymes that carry a signal from the surface of a cell to its nucleus, where genes are switched on. Different branches of the family — ERK, JNK, p38 — push the cell in different directions: towards growing and dividing, or towards stopping and dying.',
  },
  'transcription-factor': {
    term: 'Transcription factor',
    gloss:
      'A protein that binds to DNA and decides whether a gene is read or left alone. One of them can switch on a whole set of genes at once, which is why they are where a cell’s decisions are made.',
  },
  nrf2: {
    term: 'Nrf2',
    gloss:
      'A protein held inactive in the cell until damage or chemical stress releases it. It then moves into the nucleus and switches on the genes for the body’s own protective and detoxifying enzymes — the cell turning up its own defences.',
  },
  are: {
    term: 'Antioxidant response element',
    gloss:
      'A short stretch of DNA sitting in front of the body’s protective genes, like a switch beside a door. Nrf2 binds to it, and the genes behind it are read — which is the mechanism by which a diet can raise the body’s own defences.',
  },
  apoptosis: {
    term: 'Apoptosis',
    gloss:
      'Programmed cell death: the orderly self-destruction a damaged cell carries out rather than dividing and passing the damage on. Cancer cells characteristically escape it, so making them able to do it again is one of the aims of treatment.',
  },
  chemoprevention: {
    term: 'Cancer chemoprevention',
    gloss:
      'Using ordinary compounds — very often ones found in food — to stop a cancer from ever starting, rather than treating one that already exists. It is prevention studied with the tools of pharmacology.',
  },
  polyphenol: {
    term: 'Polyphenol',
    gloss:
      'A large family of compounds made by plants and abundant in tea, fruit and vegetables. Many of them mop up the reactive molecules that damage DNA, which is why they are studied in cancer prevention.',
  },
  egcg: {
    term: 'EGCG (epigallocatechin-3-gallate)',
    gloss:
      'The principal polyphenol in green tea, and the compound behind most of what has been claimed for green tea and cancer. It is one of the most heavily studied dietary compounds in the literature.',
  },
  peitc: {
    term: 'Phenethyl isothiocyanate',
    gloss:
      'The pungent compound found in watercress, mustard and other cruciferous vegetables — the sharpness on the tongue is the chemical itself. It is studied because it switches on the enzymes that clear carcinogens out of the body.',
  },
  'phase-two-enzymes': {
    term: 'Phase II enzymes',
    gloss:
      'The body’s second-stage detoxifying enzymes. They take a harmful chemical that the first stage has altered and fix a handle onto it that makes it dissolve in water, so that it can be carried out of the body rather than sitting in it.',
  },
  carcinogen: {
    term: 'Carcinogen',
    gloss:
      'Anything that can cause cancer — a chemical, a radiation, a virus — usually by damaging the DNA in a cell or by driving cells to divide when they should be at rest.',
  },
  angiogenesis: {
    term: 'Angiogenesis',
    gloss:
      'The growth of new blood vessels. Past a certain size a tumour cannot live on what reaches it by diffusion and must persuade the body to plumb it in, which is why cutting off that supply is a line of cancer treatment.',
  },
  'dna-sequencing': {
    term: 'DNA sequencing',
    gloss:
      'Reading the order of the four chemical letters along a strand of DNA. Nearly all of modern genetics rests on being able to do it, and in the early 1990s doing it well was still specialist work.',
  },
  'biochemical-genetics': {
    term: 'Biochemical genetics',
    gloss:
      'The study of genes through the chemistry they produce — which proteins and enzymes a gene builds, and what fails when the gene is faulty. It is genetics approached from the direction of the machinery rather than the inheritance.',
  },
  microarray: {
    term: 'Microarray',
    gloss:
      'A chip carrying thousands of tiny DNA probes, which lets the activity of many genes be measured in one pass instead of one gene at a time. It is how a laboratory asks a whole cell what it is currently doing.',
  },
  'rt-pcr': {
    term: 'Kinetic RT-PCR',
    gloss:
      'A method for copying a stretch of RNA into DNA and then doubling it over and over, measuring the amount as it goes. Because the measuring happens during the reaction rather than at the end, the quantity in the original sample can be worked back.',
  },
  'forensic-toxicology': {
    term: 'Forensic toxicology',
    gloss:
      'The analysis of tissue and body fluids for drugs, alcohol and poisons, in order to establish what part they played in a death or an accident. In aviation it is part of how the cause of a crash is determined.',
  },
}

/** `{{Nrf2|nrf2}}` and `{{Nrf2}}` both land here. */
export const glossaryKey = (raw: string): string =>
  raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const lookUp = (raw: string): GlossaryEntry | undefined =>
  GLOSSARY[glossaryKey(raw)]
