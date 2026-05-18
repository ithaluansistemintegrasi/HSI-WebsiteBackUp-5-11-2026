import { useState } from "react";
import whatsappLogo from "../assets/whatsapp-logo.png";

const WA_NUMBER = "6289508054752";
const WA_URL = `https://wa.me/${WA_NUMBER}`;

export default function FloatingWhatsApp() {
  const [logoError, setLogoError] = useState(false);

  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Hubungi kami lewat WhatsApp"
      title="Hubungi kami lewat WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 md:bottom-7 md:right-7 md:h-16 md:w-16"
    >
      <img
        src={whatsappLogo}
        alt=""
        className="h-20 w-20 object-contain md:h-20 md:w-20"
        onError={() => setLogoError(true)}
      />
    </a>
  );
}
