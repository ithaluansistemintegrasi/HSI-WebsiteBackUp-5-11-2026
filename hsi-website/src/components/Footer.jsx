import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoHSI from "../assets/hsi-logo.png";
import { NAV_LINKS } from "../data/navLinks";

export default function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const goToSection = (id) => {
    const scrollWithOffset = () => {
      const el = document.getElementById(id);
      if (!el) return;

      const footerOffset = 0;
      const y =
        el.getBoundingClientRect().top + window.pageYOffset - footerOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    };

    if (location.pathname === "/") {
      requestAnimationFrame(scrollWithOffset);
      return;
    }

    navigate(`/#${id}`);
    setTimeout(scrollWithOffset, 150);
  };

  const goToPage = (to) => navigate(to);

  const onNavClick = (l) => {
    if (l.type === "page") return goToPage(l.to);
    return goToSection(l.id);
  };

  const IG_URL = "https://instagram.com/haluansistemintegrasi";
  const LI_URL = "https://www.linkedin.com/company/pt-haluan-sistem-integrasi/";
  const WA_NUMBER = "6289508054752"; // format internasional tanpa +
  const WA_URL = `https://wa.me/${WA_NUMBER}`;

  const SocialButton = ({ href, label, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 transition"
    >
      {children}
    </a>
  );

  return (
    <footer className="bg-[#5D9FC7] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* KIRI */}
          <div>
            <img
              src={logoHSI}
              alt="HSI Logo"
              className="h-12 w-auto object-contain"
            />

            <div className="mt-4 text-sm leading-relaxed text-white/90 max-w-xs">
              <div className="font-semibold text-white text-xl">
                {t("footer.companyName")}
              </div>
              <div className="text-base">{t("footer.address")}</div>

              {/* SOCIAL BUTTONS (DI BAWAH ALAMAT) */}
              <div className="mt-4 flex items-center gap-3">
                <SocialButton href={IG_URL} label="Instagram">
                  {/* Instagram icon */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 2H17C20.3137 2 23 4.68629 23 8V16C23 19.3137 20.3137 22 17 22H7C3.68629 22 1 19.3137 1 16V8C1 4.68629 3.68629 2 7 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 6.5H18.01"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </SocialButton>

                <SocialButton href={LI_URL} label="LinkedIn">
                  {/* LinkedIn icon */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 4.5C4 3.11929 5.11929 2 6.5 2C7.88071 2 9 3.11929 9 4.5C9 5.88071 7.88071 7 6.5 7C5.11929 7 4 5.88071 4 4.5Z"
                      fill="currentColor"
                    />
                    <path d="M4.5 9H8.5V22H4.5V9Z" fill="currentColor" />
                    <path
                      d="M10 9H14V10.8C14.6 9.8 15.9 8.7 18 8.7C21.7 8.7 22 11.2 22 14.4V22H18V15.2C18 13.6 18 11.7 16.1 11.7C14.1 11.7 14 13.4 14 15.1V22H10V9Z"
                      fill="currentColor"
                    />
                  </svg>
                </SocialButton>

                <SocialButton href={WA_URL} label="WhatsApp">
                  {/* WhatsApp icon */}
                  <SocialButton href={WA_URL} label="WhatsApp">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="block"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20.52 3.478A11.94 11.94 0 0 0 12.017 0C5.396 0 0 5.396 0 12.017c0 2.119.553 4.186 1.607 6.014L0 24l6.166-1.57a11.98 11.98 0 0 0 5.851 1.494h.005c6.62 0 12.017-5.396 12.017-12.017a11.93 11.93 0 0 0-3.519-8.429zM12.022 21.79h-.004a9.85 9.85 0 0 1-5.02-1.378l-.36-.214-3.656.931.976-3.556-.235-.374a9.86 9.86 0 0 1-1.51-5.258c0-5.45 4.44-9.89 9.9-9.89a9.83 9.83 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.9 6.995c0 5.45-4.44 9.89-9.89 9.89zm5.434-7.435c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.669.15-.198.297-.767.967-.94 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.496.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.214 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    </svg>
                  </SocialButton>
                </SocialButton>
              </div>
            </div>
          </div>

          {/* TENGAH */}
          <div className="md:justify-self-center">
            <div className="font-semibold text-lg mb-3">
              {t("footer.navTitle")}
            </div>

            <ul className="space-y-2 text-base text-white/90">
              {NAV_LINKS.map((l) => (
                <li key={l.key}>
                  <button
                    type="button"
                    onClick={() => onNavClick(l)}
                    className="hover:opacity-80 transition"
                  >
                    {t(`nav.${l.key}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* KANAN */}
          <div className="md:justify-self-end w-full max-w-sm">
            <div className="rounded-md bg-white/15 p-5">
              <div className="font-semibold text-lg">
                {t("footer.contactTitle")}
              </div>

              <div className="mt-3 text-base text-white/90 space-y-2">
                <div>
                  <span className="font-medium text-white">
                    {t("footer.whatsappLabel")}
                  </span>{" "}
                  {t("footer.whatsappValue")}
                </div>

                <div>
                  <span className="font-medium text-white">
                    {t("footer.emailLabel")}
                  </span>{" "}
                  {t("footer.emailValue")}
                </div>

                <div>
                  <span className="font-medium text-white">
                    {t("footer.hoursLabel")}
                  </span>{" "}
                  {t("footer.hoursValue")}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onNavClick({ type: "section", id: "contact", key: "contact" })
                }
                className="mt-5 inline-flex items-center justify-center w-full h-10 rounded-full bg-white text-[#5D9FC7] text-sm font-semibold hover:opacity-90 transition"
              >
                {t("footer.cta")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto max-w-7xl px-6 py-4 text-center text-base text-white/90">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
