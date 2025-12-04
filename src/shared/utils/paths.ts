const normalizeSlashes = (value: string) => value.replace(/\/+/g, '/');
const trimTrailing = (value: string) => value.replace(/\/+$/, '');
const trimLeading = (value: string) => value.replace(/^\/+/, '');

const cleanBase = (base: string) => {
  const normalized = normalizeSlashes(base || '/');
  return normalized === '/' ? '/' : trimTrailing(normalized);
};

const cleanPath = (path: string) => {
  return trimLeading(normalizeSlashes(path));
}

export const getBasePath = () => {
  return cleanBase(import.meta.env.VITE_BASE_PATH || '/');
}

export const getAssetUrl = (path: string) => {
  const baseUrl = cleanBase(import.meta.env.VITE_BASE_PATH || '/');
  const cleaned = cleanPath(path);
  const merged = `${baseUrl}/${cleaned}`;
  return normalizeSlashes(merged);
};
