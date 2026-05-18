import { useEffect, useState } from "react";
import {
  FALLBACK_PARTNER_BRANDS,
  fetchActivePartners,
} from "../data/partnerBrands";

export default function usePartnerBrands() {
  const [partners, setPartners] = useState(FALLBACK_PARTNER_BRANDS);

  useEffect(() => {
    let alive = true;

    fetchActivePartners()
      .then((items) => {
        if (alive && items.length > 0) setPartners(items);
      })
      .catch(() => {
        if (alive) setPartners(FALLBACK_PARTNER_BRANDS);
      });

    return () => {
      alive = false;
    };
  }, []);

  return partners;
}
