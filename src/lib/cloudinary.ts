/** Ask Cloudinary for a smaller, auto-optimised version of an image. */
export function img(url: string | undefined, width = 600): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
