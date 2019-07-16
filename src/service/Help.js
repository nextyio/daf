export function cutString (s) {
  if (!s) return 'empty'
  if (s.length < 10) return s
  var first5 = s.substring(0, 5).toLowerCase()
  var last3 = s.slice(-3)
  return first5 + '...' + last3
}
