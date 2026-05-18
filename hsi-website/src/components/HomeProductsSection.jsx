import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function HomeProductsSection({
  isInView,
  revealClass,
  delayStyle,
}) {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "https://api.darul.hsi-fablab.com";

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError("");

      try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(data?.message || `Request failed (${res.status})`);
        }

        if (mounted) {
          const nextProducts = Array.isArray(data) ? data : [];
          setProducts(nextProducts);
          setActiveIndex(null);
        }
      } catch (err) {
        if (mounted) {
          setProducts([]);
          setProductsError(err?.message || "Gagal memuat produk");
        }
      } finally {
        if (mounted) setProductsLoading(false);
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  return (
    <>
      <h2
        className={`text-center text-white text-5xl md:text-6xl font-medium ${revealClass(
          isInView,
          "up",
        )}`}
        style={delayStyle(0)}
      >
        Our Products
      </h2>

      {productsError ? (
        <div className="mt-12 text-center text-sm text-white/90">
          {productsError}
        </div>
      ) : null}

      {!!products.length && (
        <>
          <div
            className={`mt-12 hidden lg:flex gap-4 items-stretch ${revealClass(
              isInView,
              "up",
            )}`}
            style={delayStyle(150)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {products.map((product, idx) => (
              <ExpandingProductCard
                key={product.id}
                title={product.name || product.title || ""}
                imageUrl={toImageUrl(API_BASE, product.imageUrl)}
                to={`/products/${product.slug}`}
                isActive={idx === activeIndex}
                hasActive={activeIndex !== null}
                onActivate={() => setActiveIndex(idx)}
              />
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:hidden">
            {products.map((product, idx) => (
              <div
                key={product.id}
                className={revealClass(isInView, "up")}
                style={delayStyle(150 + idx * 70)}
              >
                <MobileProductCard
                  title={product.name || product.title || ""}
                  imageUrl={toImageUrl(API_BASE, product.imageUrl)}
                  to={`/products/${product.slug}`}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {!productsLoading && !products.length && !productsError ? (
        <div className="mt-10 text-center text-sm text-white/90">
          Belum ada produk yang dipublish.
        </div>
      ) : null}
    </>
  );
}

function toImageUrl(apiBase, imageUrl) {
  if (!imageUrl) return "";
  return imageUrl.startsWith("http") ? imageUrl : `${apiBase}${imageUrl}`;
}

function ExpandingProductCard({
  imageUrl,
  title,
  to,
  isActive,
  hasActive,
  onActivate,
}) {
  const wrapperClass = [
    "relative min-w-0 basis-0 overflow-hidden rounded-[28px] transition-all duration-500 ease-out",
    isActive ? "flex-[4.8]" : hasActive ? "flex-[0.78]" : "flex-1",
  ].join(" ");

  return (
    <Link
      to={to}
      className={wrapperClass}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      aria-label={title}
    >
      <div className="group relative h-[430px] w-full overflow-hidden rounded-[28px]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
              isActive ? "scale-100" : "scale-[1.03]"
            }`}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-500" />
        )}

        <div
          className={`absolute inset-0 transition-all duration-500 ${
            isActive ? "bg-black/20" : "bg-black/45"
          } group-hover:bg-black/20`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        <div
          className={`absolute inset-0 flex items-end justify-center pb-5 transition-all duration-300 ${
            isActive ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
          } group-hover:translate-y-6 group-hover:opacity-0 group-focus-visible:translate-y-6 group-focus-visible:opacity-0`}
        >
          <p className="rotate-180 text-xs font-semibold uppercase tracking-[0.18em] text-white [writing-mode:vertical-rl]">
            {title}
          </p>
        </div>

        <div
          className={`absolute inset-0 flex items-center justify-center px-6 text-center transition-all duration-300 ${
            isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          } group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100`}
        >
          <div>
            <h3 className="text-2xl font-bold uppercase tracking-[0.08em] text-white drop-shadow-lg xl:text-4xl">
              {title}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MobileProductCard({ imageUrl, title, to }) {
  return (
    <Link
      to={to}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-[210px] overflow-hidden bg-slate-200">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-slate-400" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <p className="text-2xl font-semibold uppercase tracking-[0.08em] text-white drop-shadow-md">
            {title}
          </p>
        </div>
      </div>
    </Link>
  );
}
