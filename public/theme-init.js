/* The Herald boot script.
   1. Applies the stored theme before first paint so neither edition flashes.
   2. Injects the site's JSON-LD structured data (kept out of the React tree
      so server HTML and client hydration always match). */
(function () {
  try {
    var theme = localStorage.getItem('herald-theme')
    var root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme === 'light' ? 'light' : 'dark')
  } catch (e) {
    document.documentElement.classList.add('dark')
  }

  try {
    var ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Repent and Prepare the Way',
      description:
        'The publication desk of the Ministry of Repentance and Holiness — teachings, prophecies, and oracles, faithfully told.',
      publisher: {
        '@type': 'Organization',
        name: 'Ministry of Repentance and Holiness',
      },
    })
    document.head.appendChild(ld)
  } catch (e) {}
})()
