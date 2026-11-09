(function () {
  var KEY = 'vigiiap:chunk-reload-attempted'
  function reloadOnce() {
    var already
    try { already = sessionStorage.getItem(KEY) } catch (e) { already = null }
    if (already) return
    try { sessionStorage.setItem(KEY, '1') } catch (e) { /* modo privado — recarga igual, sin guardia */ }
    window.location.reload()
  }
  window.addEventListener('vite:preloadError', reloadOnce)
  window.addEventListener('error', function (event) {
    var t = event.target
    if (t && t.tagName === 'SCRIPT' && t.type === 'module') { reloadOnce(); return }
    if ((t === window || !t) && !window.__VIGIIAP_MOUNTED__) reloadOnce()
  }, true)
})()
