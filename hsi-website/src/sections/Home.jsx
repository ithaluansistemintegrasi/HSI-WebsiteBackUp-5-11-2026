import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import heroBg from "../assets/hero-section/hero-image1.webp";
import aboutImg from "../assets/about-section/about-image1.webp";
import servicesImg from "../assets/services-section/services.jpg";
import preownedImg from "../assets/preowned-section/preowned.jpg";

import SeasonGreetingPopup from "../components/SeasonGreeting";

import HomeProductsSection from "../components/HomeProductsSection";
import usePartnerBrands from "../hooks/usePartnerBrands";

import serviceLogo1 from "../assets/services-section/services-logo1.png";
import serviceLogo2 from "../assets/services-section/services-logo2.png";
import serviceLogo3 from "../assets/services-section/services-logo3.png";

const P_TEXT = "text-[18px] leading-relaxed";

const INITIAL_FORM = { name: "", email: "", phone: "", message: "" };
const INITIAL_TOUCHED = {
  name: false,
  email: false,
  phone: false,
  message: false,
};

function useInView({ threshold = 0.2, root = null, rootMargin = "0px" } = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setIsInView(true));
      return () => cancelAnimationFrame(frame);
    }

    const obs = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold, root, rootMargin },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, root, rootMargin]);

  return [ref, isInView];
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function revealClass(isInView, from = "up") {
  const base = "transition-all duration-700 ease-out will-change-transform";
  const hidden =
    from === "up"
      ? "opacity-0 translate-y-8"
      : from === "down"
        ? "opacity-0 -translate-y-8"
        : from === "left"
          ? "opacity-0 -translate-x-10"
          : "opacity-0 translate-x-10";

  const shown = "opacity-100 translate-x-0 translate-y-0";
  return `${base} ${isInView ? shown : hidden}`;
}

function delayStyle(ms = 0) {
  return ms ? { transitionDelay: `${ms}ms` } : undefined;
}

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function getFormErrors(form) {
  const name = form.name.trim().length > 0;
  const email = EMAIL_RE.test(form.email.trim());
  const phone = form.phone.trim().length >= 8;
  const message = form.message.trim().length > 0;
  return { name: !name, email: !email, phone: !phone, message: !message };
}

function ytEmbed(id) {
  return `https://www.youtube.com/embed/${id}`;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function Dots({ count, active, onSelect }) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
            i === active
              ? "scale-110 bg-slate-900"
              : "bg-slate-300 hover:scale-110 hover:bg-slate-400"
          }`}
          aria-label={`Go to slide ${i + 1}`}
          type="button"
        />
      ))}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6 text-center md:mb-8">
      <h2 className="text-2xl font-medium text-gray-900 md:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 text-[18px] text-gray-600">{subtitle}</p>
      ) : null}
    </div>
  );
}

function BrandCarousel({ items }) {
  const [idx, setIdx] = useState(0);

  const perSlide = 4;
  const slides = useMemo(() => chunk(items, perSlide), [items]);
  const total = slides.length;

  useEffect(() => {
    setIdx(0);
  }, [total]);

  const prev = () => setIdx((v) => (v - 1 + total) % total);
  const next = () => setIdx((v) => (v + 1) % total);

  return (
    <section className="animate-fade-up-soft bg-[#8FC3DC] py-16 md:py-24">
      <div className="w-full px-4 md:px-6">
        <h2 className="mb-10 text-center text-5xl font-semibold text-white md:mb-14 md:text-6xl ">
          Our Trusted Partners
        </h2>

        <div className="flex items-center justify-center gap-4 md:gap-7">
          <button
            onClick={prev}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/35 bg-white/12 text-3xl text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20 hover:shadow-[0_0_24px_rgba(255,255,255,0.18)] md:h-16 md:w-16"
            aria-label="Previous brands"
            type="button"
          >
            ‹
          </button>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {(slides[idx] || []).map((p) => {
              const CardTag = p.linkUrl ? "a" : "div";

              return (
                <CardTag
                  key={p.id || p.name}
                  href={p.linkUrl || undefined}
                  target={p.linkUrl ? "_blank" : undefined}
                  rel={p.linkUrl ? "noreferrer" : undefined}
                  className="flex h-[110px] items-center justify-center rounded-[22px] bg-white px-6 py-5 shadow-[0_10px_30px_rgba(255,255,255,0.12)] transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_18px_40px_rgba(255,255,255,0.24)] md:h-[130px] md:px-8"
                >
                  <img
                    src={p.src}
                    alt={p.name}
                    className="max-h-14 w-auto max-w-full object-contain md:max-h-16"
                    loading="lazy"
                  />
                </CardTag>
              );
            })}
          </div>

          <button
            onClick={next}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/35 bg-white/12 text-3xl text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20 hover:shadow-[0_0_24px_rgba(255,255,255,0.18)] md:h-16 md:w-16"
            aria-label="Next brands"
            type="button"
          >
            ›
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-3 w-3 rounded-full transition-all duration-300 ${
                i === idx
                  ? "scale-110 bg-slate-900"
                  : "bg-white/55 hover:scale-110 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoCarousel({ videos }) {
  const [idx, setIdx] = useState(0);
  const total = videos.length;
  const active = videos[idx];

  return (
    <div className="rounded-2xl bg-white p-4 md:p-6">
      <div className="grid items-start gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 md:text-6xl">
            {active.title}
          </h3>
          {active.desc ? (
            <p className="mt-2 text-[18px] leading-relaxed text-slate-600">
              {active.desc}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {videos.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setIdx(i)}
                className={`rounded-xl border px-3 py-2 text-xs transition-all duration-300 md:text-sm ${
                  i === idx
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-50"
                }`}
              >
                {v.label ?? `Video ${i + 1}`}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full">
          <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="pt-[56.25%]" />
            <iframe
              key={active.id}
              className="absolute inset-0 h-full w-full"
              src={ytEmbed(active.id)}
              title={active.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <Dots count={total} active={idx} onSelect={setIdx} />
        </div>
      </div>
    </div>
  );
}

function PartnersAndVideosSection() {
  const partners = usePartnerBrands();

  const videos = [
    {
      id: "-",
      title: "Company Profile",
      label: "Profile",
      desc: "Gambaran singkat perusahaan dan kapabilitas utama.",
    },
    {
      id: "-",
      title: "Product / Solution Overview",
      label: "Solution",
      desc: "Highlight produk/solusi dan contoh penerapan.",
    },
    {
      id: "-",
      title: "After Sales & Service",
      label: "Service",
      desc: "Alur support, after-sales, dan layanan teknis.",
    },
  ];

  return (
    <section id="partners" className="bg-white">
      <div className="w-full py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 hidden">
          <VideoCarousel videos={videos} />
        </div>

        <BrandCarousel items={partners} />
      </div>
    </section>
  );
}

export default function Home() {
  const [sending, setSending] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const { t } = useTranslation();

  const serviceIcons = [serviceLogo1, serviceLogo2, serviceLogo3];

  const [aboutRef, aboutInView] = useInView({ threshold: 0.25 });
  const [productsRef, productsInView] = useInView({ threshold: 0.2 });
  const [servicesRef, servicesInView] = useInView({ threshold: 0.2 });
  const [preownedRef, preownedInView] = useInView({ threshold: 0.2 });
  const [contactRef, contactInView] = useInView({ threshold: 0.2 });
  const [mapRef, mapInView] = useInView({ threshold: 0.2 });

  useEffect(() => {
    document.title = "PT Haluan Sistem Integrasi";
  }, []);

  const FORM_FIELDS = [
    {
      key: "name",
      label: t("home.contact.form.name.label"),
      type: "text",
      placeholder: t("home.contact.form.name.placeholder"),
      error: t("home.contact.form.name.error"),
    },
    {
      key: "email",
      label: t("home.contact.form.email.label"),
      type: "email",
      placeholder: t("home.contact.form.email.placeholder"),
      error: t("home.contact.form.email.error"),
    },
    {
      key: "phone",
      label: t("home.contact.form.phone.label"),
      type: "tel",
      inputMode: "numeric",
      placeholder: t("home.contact.form.phone.placeholder"),
      error: t("home.contact.form.phone.error"),
    },
    {
      key: "message",
      label: t("home.contact.form.message.label"),
      type: "textarea",
      rows: 6,
      placeholder: t("home.contact.form.message.placeholder"),
      error: t("home.contact.form.message.error"),
    },
  ];

  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);

  const errors = getFormErrors(form);
  const isValid = Object.values(errors).every((v) => !v);

  const setField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: name === "phone" ? onlyDigits(value) : value,
    }));
  };

  const markTouched = (name) =>
    setTouched((prev) => ({ ...prev, [name]: true }));

  const markAllTouched = () => {
    setTouched((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, true])),
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    markAllTouched();
    if (!isValid) return;

    try {
      setSending(true);

      const res = await fetch("/api/contact.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Gagal mengirim pesan.");
      }

      setSuccessOpen(true);
      setForm(INITIAL_FORM);
      setTouched(INITIAL_TOUCHED);
    } catch (err) {
      alert(err?.message || "Terjadi kesalahan saat mengirim pesan.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SeasonGreetingPopup delay={600} autoCloseMs={0} />

      {successOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    {t("home.contact.success.title")}
                  </div>
                  <p className="mt-2 text-[18px] leading-relaxed text-slate-600">
                    {t("home.contact.success.desc")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="mt-5 h-10 w-full rounded-full bg-[#4D6CFF] text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <div
          id="home"
          className="relative h-[520px] w-full overflow-hidden md:h-[560px]"
        >
          <img
            alt="HSI Hero"
            className="absolute inset-0 h-full w-full object-cover animate-zoom-soft"
            src={heroBg}
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-[#5D9FC7]/55" />

          <div className="relative mx-auto h-full max-w-7xl px-6">
            <div className="flex h-full items-center justify-end">
              <div className="max-w-xl text-center animate-fade-up-soft md:text-right">
                <h1 className="animate-slide-in-right text-5xl font-bold leading-tight text-white md:text-6xl">
                  {t("home.hero.title")}
                </h1>
                <h2 className="animate-slide-in-right animate-delay-150 mt-4 text-xl text-white/90 md:text-2xl">
                  {t("home.hero.subtitle")}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <section id="about" className="bg-white" ref={aboutRef}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex min-h-[360px] items-center py-10 md:min-h-[440px] md:py-12 lg:min-h-[520px] lg:py-0">
              <div className="mx-auto w-full max-w-7xl px-6 md:px-10 lg:px-12">
                <h2
                  className={`text-5xl text-center font-medium leading-tight text-gray-900 md:text-6xl md:text-left ${revealClass(
                    aboutInView,
                    "left",
                  )}`}
                  style={delayStyle(0)}
                >
                  {t("home.about.title")}
                </h2>

                <p
                  className={`mt-7 max-w-2xl text-[18px] leading-relaxed text-gray-900 ${revealClass(
                    aboutInView,
                    "left",
                  )}`}
                  style={delayStyle(150)}
                >
                  {t("home.about.desc")}
                </p>

                <div
                  className={`mt-8 ${revealClass(aboutInView, "left")} text-right`}
                  style={delayStyle(300)}
                >
                  <Link
                    to="/tentang-kami"
                    className="inline-flex items-center gap-2 text-lg text-[#4D6CFF] transition-all duration-300 hover:translate-x-1 hover:opacity-70"
                  >
                    {t("home.about.more")} <span aria-hidden>›</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative min-h-[320px] md:min-h-[420px] lg:min-h-[520px]">
              <img
                src={aboutImg}
                alt="About HSI"
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover ${revealClass(
                  aboutInView,
                  "right",
                )}`}
                style={delayStyle(150)}
              />
            </div>
          </div>
        </section>

        <section id="products" className="bg-[#8FC3DC]" ref={productsRef}>
          <div className="mx-auto max-w-7xl px-6 py-10 md:py-20">
            <HomeProductsSection
              isInView={productsInView}
              revealClass={revealClass}
              delayStyle={delayStyle}
            />
          </div>
        </section>

        <section id="services" className="bg-white" ref={servicesRef}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="py-16 md:py-24">
              <div className="mx-auto max-w-7xl px-[59.5px] lg:pr-12">
                <h2
                  className={`text-5xl font-medium text-gray-900 text-center md:text-6xl md:text-left ${revealClass(
                    servicesInView,
                    "left",
                  )}`}
                  style={delayStyle(0)}
                >
                  {t("home.services.title")}
                </h2>

                <div className="mt-10 space-y-8">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={revealClass(servicesInView, "left")}
                      style={delayStyle(150 + i * 120)}
                    >
                      <ServiceItem
                        text={t(`home.services.items.${i}`)}
                        icon={serviceIcons[i]}
                        alt={`Service icon ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative min-h-[320px] bg-white md:min-h-[420px] lg:min-h-[520px]">
              <img
                src={servicesImg}
                alt={t("home.services.imageAlt")}
                className={`absolute inset-0 h-full w-full object-contain ${revealClass(
                  servicesInView,
                  "right",
                )}`}
                style={delayStyle(150)}
              />
            </div>
          </div>
        </section>

        <section id="preowned" className="w-full" ref={preownedRef}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative min-h-[320px] bg-[#8FC3DC] md:min-h-[420px] lg:min-h-[520px]">
              <img
                src={preownedImg}
                alt={t("home.preowned.imageAlt")}
                className={`absolute inset-0 h-full w-full object-cover ${revealClass(
                  preownedInView,
                  "left",
                )}`}
                style={delayStyle(150)}
              />
            </div>

            <div className="bg-[#8FC3DC] text-white">
              <div className="flex h-full items-center">
                <div className="w-full px-6 py-16 md:py-24 lg:px-14">
                  <h2
                    className={`text-center text-5xl font-medium md:text-6xl md:text-right ${revealClass(
                      preownedInView,
                      "right",
                    )}`}
                    style={delayStyle(0)}
                  >
                    {t("home.preowned.title")}
                  </h2>

                  <p
                    className={`mt-6 ml-auto max-w-md whitespace-pre-line text-center text-white/90 md:text-right ${P_TEXT} ${revealClass(
                      preownedInView,
                      "right",
                    )}`}
                    style={delayStyle(150)}
                  >
                    {t("home.preowned.desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PartnersAndVideosSection />

        <section id="contact" className="bg-white" ref={contactRef}>
          <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
            <h2
              className={`text-3xl font-medium text-gray-900 md:text-6xl ${revealClass(
                contactInView,
                "left",
              )}`}
              style={delayStyle(0)}
            >
              {t("home.contact.title")}
            </h2>

            <div className="mt-10 grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
              <div
                className={revealClass(contactInView, "left")}
                style={delayStyle(150)}
              >
                <form className="max-w-md" onSubmit={onSubmit} noValidate>
                  <div className="grid grid-cols-[80px_1fr] items-start gap-x-6 gap-y-4">
                    {FORM_FIELDS.map((field) => (
                      <FormRow
                        key={field.key}
                        field={field}
                        value={form[field.key]}
                        touched={touched[field.key]}
                        hasError={errors[field.key]}
                        onChange={setField}
                        onBlur={markTouched}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={!isValid || sending}
                    className={`mt-8 h-10 w-full rounded-full text-sm font-medium text-white transition-all duration-300 md:text-base ${
                      isValid && !sending
                        ? "bg-[#7AD35A] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg"
                        : "cursor-not-allowed bg-gray-300"
                    }`}
                  >
                    {sending ? "Mengirim..." : t("home.contact.submit")}
                  </button>
                </form>
              </div>

              <div
                className={revealClass(mapInView, "up")}
                style={delayStyle(150)}
                ref={mapRef}
              >
                <div className="w-full overflow-hidden rounded transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="h-[220px] w-full md:h-[250px]">
                    <iframe
                      title={t("home.contact.mapTitle")}
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.574973042664!2d106.683684!3d-6.3194243000000005!2m3!1f0!2f0!3f0!2m3!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69fbd030c7bac9%3A0x6748b9ff6e7e85c8!2sPT%20Haluan%20Sistem%20Integrasi!5e0!3m2!1sen!2sid!4v1776762080162!5m2!1sen!2sid"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <div className="bg-[#8FC3DC] p-4 text-base leading-relaxed text-white md:text-base">
                    <div className="font-semibold">
                      {t("home.contact.cardTitle")}
                    </div>
                    <div>{t("home.contact.cardAddress")}</div>
                    <div className="mt-2">{t("home.contact.cardPhone")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function FormRow({ field, value, touched, hasError, onChange, onBlur }) {
  const base =
    "w-full rounded border px-3 text-sm outline-none transition-all duration-200 focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(96,165,250,0.15)] md:text-base";
  const border = touched && hasError ? "border-red-400" : "border-gray-300";
  const inputClass =
    field.type === "textarea"
      ? `${base} py-2 ${border}`
      : `h-9 ${base} ${border}`;

  return (
    <>
      <label className="pt-2 text-sm text-gray-700 md:text-base">
        {field.label}
      </label>

      <div>
        {field.type === "textarea" ? (
          <textarea
            name={field.key}
            rows={field.rows ?? 6}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.key, e.target.value)}
            onBlur={() => onBlur(field.key)}
            className={inputClass}
          />
        ) : (
          <input
            name={field.key}
            type={field.type}
            inputMode={field.inputMode}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.key, e.target.value)}
            onBlur={() => onBlur(field.key)}
            className={inputClass}
          />
        )}

        {touched && hasError && (
          <p className="mt-1 text-[18px] text-red-500">{field.error}</p>
        )}
      </div>
    </>
  );
}

function ServiceItem({ text, icon, alt = "Service icon" }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center transition-transform duration-300 hover:translate-x-1 md:flex-row md:items-start md:text-left">
      <img
        src={icon}
        alt={alt}
        className="h-16 w-16 shrink-0 object-contain  transition-transform duration-300 hover:scale-105"
      />

      <p className={`max-w-xl whitespace-pre-line text-gray-700 ${P_TEXT}`}>
        {text}
      </p>
    </div>
  );
}
