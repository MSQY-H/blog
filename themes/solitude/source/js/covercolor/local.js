import { applyThemeColor, getCoverSource, resolveColor, rgbToHex } from "./shared.js";

const extractLocalColor = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.addEventListener("load", () => {
    try {
      resolve(rgbToHex(new ColorThief().getColor(image), 0.8));
    } catch (error) {
      reject(error);
    }
  }, { once: true });
  image.addEventListener("error", () => reject(new Error(`Unable to load ${source}`)), { once: true });
  image.src = source;
});

export const coverColor = (music = false) => {
  const configured = !music && Solitude.page.color;
  if (configured && /^#[0-9a-f]{6}$/i.test(configured)) return applyThemeColor(configured);
  return resolveColor(getCoverSource(music), extractLocalColor, music);
};
