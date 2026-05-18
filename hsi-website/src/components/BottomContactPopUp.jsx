import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import whatsappLogo from "../assets/whatsapp-logo.png";

const WA_NUMBER = "6289508054752";
const WA_URL = `https://wa.me/${WA_NUMBER}`;

export default function BottomContactPopup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsOpen(false);
    setIsDismissed(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDismissed) return undefined;

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollableHeight = doc.scrollHeight - window.innerHeight;
      const nearBottom = window.scrollY >= scrollableHeight - 120;
      const hasScrollablePage = scrollableHeight > 180;

      if (hasScrollablePage && nearBottom) setIsOpen(true);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [isDismissed]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const closePopup = () => {
    setIsOpen(false);
    setIsDismissed(true);
  };

  const goToContact = () => {
    closePopup();

    if (location.pathname === "/") {
      const target = document.getElementById("contact");
      if (target) {
        const headerOffset = window.innerWidth < 768 ? 64 : 80;
        const y =
          target.getBoundingClientRect().top +
          window.pageYOffset -
          headerOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
        return;
      }
    }

    navigate("/?section=contact");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#12384F]/65 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-contact-popup-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-white/35 bg-white p-6 pb-16 text-center shadow-2xl shadow-black/25 sm:p-8 sm:pb-16">
        <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-[#5D9FC7]" />

        <h2
          id="bottom-contact-popup-title"
          className="text-2xl font-bold uppercase tracking-wide text-[#245F82] sm:text-3xl"
        >
          {t("contactPopup.title")}
        </h2>

        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
          {t("contactPopup.desc")}
        </p>

        <button
          type="button"
          onClick={goToContact}
          className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#5D9FC7] px-6 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#5D9FC7]/25 transition hover:bg-[#4B8FB8] focus:outline-none focus:ring-4 focus:ring-[#5D9FC7]/30 sm:h-14 sm:text-base"
        >
          {t("contactPopup.primary")}
        </button>

        <button
          type="button"
          onClick={closePopup}
          className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 transition hover:text-[#5D9FC7] focus:outline-none focus:text-[#5D9FC7]"
        >
          {t("contactPopup.secondary")}
        </button>

        <a
          href={WA_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Hubungi kami lewat WhatsApp"
          title="Hubungi kami lewat WhatsApp"
          className="absolute bottom-4 right-5 inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none  sm:bottom-5 sm:right-7 sm:h-12 sm:w-12"
        >
          <img
            src={whatsappLogo}
            alt=""
            className="h-7 w-7 object-contain sm:h-8 sm:w-8"
          />
        </a>
      </div>
    </div>
  );
}
