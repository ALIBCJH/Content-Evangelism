/* The Herald boot script: applies the stored theme before first paint so
   neither edition flashes. (Structured data is server-rendered in the
   layout — crawlers never see anything injected here.) */
(function () {
  try {
    var theme = localStorage.getItem('herald-theme')
    var root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme === 'light' ? 'light' : 'dark')
  } catch (e) {
    document.documentElement.classList.add('dark')
  }
})()
