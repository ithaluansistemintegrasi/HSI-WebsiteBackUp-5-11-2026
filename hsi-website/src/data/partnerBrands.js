import brand1 from "../assets/about-section/about-page/brand-1.svg";
import brand2 from "../assets/about-section/about-page/brand-2.jpg";
import brand3 from "../assets/about-section/about-page/brand-3.jpg";
import brand4 from "../assets/about-section/about-page/brand-4.png";
import brand5 from "../assets/about-section/about-page/brand-5.png";
import brand6 from "../assets/about-section/about-page/brand-6.png";
import brand7 from "../assets/about-section/about-page/brand-7.png";
import brand8 from "../assets/about-section/about-page/brand-8.jpg";
import brand9 from "../assets/about-section/about-page/brand-9.png";
import brand10 from "../assets/about-section/about-page/brand-10.png";
import brand11 from "../assets/about-section/about-page/brand-11.png";
import brand12 from "../assets/about-section/about-page/brand-12.png";
import brand13 from "../assets/about-section/about-page/brand-13.png";
import brand14 from "../assets/about-section/about-page/brand-14.png";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "https://api.darul.hsi-fablab.com";

export const FALLBACK_PARTNER_BRANDS = [
  { name: "Brand 1", src: brand1, linkUrl: "" },
  { name: "Brand 2", src: brand2, linkUrl: "" },
  { name: "Brand 3", src: brand3, linkUrl: "" },
  { name: "Brand 4", src: brand4, linkUrl: "" },
  { name: "Brand 5", src: brand5, linkUrl: "" },
  { name: "Brand 6", src: brand6, linkUrl: "" },
  { name: "Brand 7", src: brand7, linkUrl: "" },
  { name: "Brand 8", src: brand8, linkUrl: "" },
  { name: "Brand 9", src: brand9, linkUrl: "" },
  { name: "Brand 10", src: brand10, linkUrl: "" },
  { name: "Brand 11", src: brand11, linkUrl: "" },
  { name: "Brand 12", src: brand12, linkUrl: "" },
  { name: "Brand 13", src: brand13, linkUrl: "" },
  { name: "Brand 14", src: brand14, linkUrl: "" },
];

export function partnerImageUrl(imageUrl) {
  if (!imageUrl) return "";
  return imageUrl.startsWith("http") ? imageUrl : `${API_BASE}${imageUrl}`;
}

export function normalizePartner(item) {
  return {
    ...item,
    src: partnerImageUrl(item.imageUrl || item.src),
    linkUrl: item.linkUrl || "",
  };
}

export async function fetchActivePartners() {
  const res = await fetch(`${API_BASE}/partners/active`);
  if (!res.ok) throw new Error("Failed to fetch partners");

  const json = await res.json();
  const items = Array.isArray(json?.items) ? json.items : [];
  return items.map(normalizePartner);
}
