// URL of a file in the site's public folder, e.g. publicFile('f1/index.json').
// BASE_URL is the site's base path ("/pumpkio9-website/"), set in frontend/vite.config.mjs.
export const publicFile = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
