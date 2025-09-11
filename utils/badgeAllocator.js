function allocateBadge(xpPoints) {
  if (xpPoints < 200) return "🥉Beginner";
  if (xpPoints < 500) return "🥈Intermediate";
  return "🥇Advanced";
}

module.exports = allocateBadge;