const SITE = 'bchu-ops.github.io/pumpkio9-website';
const REPO = 'https://github.com/bchu-ops/pumpkio9-website';

/** GitHub URL for a Notion row's code, or null. A link to this site itself means the site's repo. */
export function codeLink(row) {
  const link = row?.link;
  if (!link) return null;
  if (link.includes(SITE)) return REPO;
  return /^https:\/\/github\.com\//.test(link) ? link : null;
}
