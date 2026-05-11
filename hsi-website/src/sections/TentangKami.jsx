// src/sections/TentangKami.jsx
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

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

const P_TEXT = "text-sm md:text-base leading-relaxed text-slate-600";
const H2 = "text-2xl md:text-3xl font-bold text-slate-900";
const CARD =
  "rounded-2xl border border-[#8FC3DC] bg-white p-6 shadow-sm hover:shadow-md transition";

const PARTNER_BRANDS = [
  { name: "Brand 1", src: brand1 },
  { name: "Brand 2", src: brand2 },
  { name: "Brand 3", src: brand3 },
  { name: "Brand 4", src: brand4 },
  { name: "Brand 5", src: brand5 },
  { name: "Brand 6", src: brand6 },
  { name: "Brand 7", src: brand7 },
  { name: "Brand 8", src: brand8 },
  { name: "Brand 9", src: brand9 },
  { name: "Brand 10", src: brand10 },
  { name: "Brand 11", src: brand11 },
  { name: "Brand 12", src: brand12 },
  { name: "Brand 13", src: brand13 },
  { name: "Brand 14", src: brand14 },
];

// Marquee / carousel jalan (pure Tailwind + CSS keyframes)
function BrandMarquee({ items, speed = 22 }) {
  const loop = [...items, ...items]; // duplicate for smooth loop

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#8FC3DC] bg-white">
      {/* edge fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-white to-white/0" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white to-white/0" />

      {/* track */}
      <div
        className="marquee-track flex w-max items-center gap-10 py-6 px-6 hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speed}s` }}
      >
        {loop.map((b, idx) => (
          <div key={`${b.name}-${idx}`} className="shrink-0">
            <div className="flex h-16 w-[160px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <img
                src={b.src}
                alt={b.name}
                className="max-h-10 w-auto object-contain opacity-90 hover:opacity-100 transition"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>

      {/* keyframes */}
      <style>{`
        .marquee-track {
          animation-name: marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default function TentangKami() {
  const { t } = useTranslation();

  const heroStats = useMemo(
    () => t("about.hero.stats", { returnObjects: true }) || [],
    [t],
  );

  const benefits = useMemo(
    () => t("about.benefits.items", { returnObjects: true }) || [],
    [t],
  );

  const values = useMemo(
    () => t("about.values.items", { returnObjects: true }) || [],
    [t],
  );

  return (
    <section className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* HERO */}
        <div className="rounded-3xl border border-[#8FC3DC] bg-gradient-to-br from-slate-50 to-white p-8 md:p-12">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[#4D6CFF]">
              {t("about.hero.kicker")}
            </p>
            <h1 className="mt-2 text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              {t("about.hero.title")}
            </h1>
            <p className={`mt-4 ${P_TEXT}`}>{t("about.hero.desc")}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/?section=contact"
                className="inline-flex items-center justify-center rounded-xl bg-[#8FC3DC] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                {t("about.hero.primaryCta")}
              </Link>

              <Link
                to="/?section=products"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
              >
                {t("about.hero.secondaryCta")}
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {heroStats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl bg-white border border-slate-200 p-4"
                >
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PROFIL */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${CARD} lg:col-span-2`}>
            <h2 className={H2}>{t("about.profile.title")}</h2>
            <p className={`mt-3 ${P_TEXT}`}>{t("about.profile.desc")}</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  {t("about.profile.missionTitle")}
                </p>
                <p className={`mt-2 ${P_TEXT}`}>{t("about.profile.mission")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  {t("about.profile.visionTitle")}
                </p>
                <p className={`mt-2 ${P_TEXT}`}>{t("about.profile.vision")}</p>
              </div>
            </div>
          </div>

          <div className={CARD}>
            <h3 className="text-lg font-bold text-slate-900">
              {t("about.benefits.title")}
            </h3>

            <ul className="mt-4 space-y-3">
              {benefits.map((text) => (
                <li key={text} className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#4D6CFF]/10 text-[#4D6CFF] text-xs font-bold">
                    ✓
                  </span>
                  <p className="text-sm text-slate-700">{text}</p>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs text-slate-500">
                {t("about.benefits.noteLabel")}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {t("about.benefits.note")}
              </p>
            </div>
          </div>
        </div>

        {/* NILAI */}
        <div className="mt-12">
          <h2 className={H2}>{t("about.values.title")}</h2>
          <p className={`mt-3 max-w-3xl ${P_TEXT}`}>{t("about.values.desc")}</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className={CARD}>
                <p className="text-sm font-semibold text-slate-900">
                  {v.title}
                </p>
                <p className={`mt-2 ${P_TEXT}`}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BRAND PARTNER */}
        <div className="mt-12">
          <h2 className={H2}>{t("about.partners.title")}</h2>
          <p className={`mt-3 max-w-3xl ${P_TEXT}`}>
            {t("about.partners.desc")}
          </p>

          <div className="mt-6">
            <BrandMarquee items={PARTNER_BRANDS} speed={22} />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl border border-slate-200 bg-[#8FC3DC] p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {t("about.cta.title")}
              </h3>
              <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-200">
                {t("about.cta.desc")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/?section=contact"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#8FC3DC] hover:opacity-90 transition"
              >
                {t("about.cta.primary")}
              </Link>
              <Link
                to="/news"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/0 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                {t("about.cta.secondary")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
