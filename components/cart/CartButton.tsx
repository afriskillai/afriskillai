"use client";

import Link from "next/link";

import { useCart } from "./CartProvider";

type CartButtonProps = {
  compact?: boolean;
  className?: string;
};

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M3 4h2l1.7 9.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 7H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function CartButton({
  compact = false,
  className = "",
}: CartButtonProps) {
  const { itemCount, isHydrated } = useCart();

  const displayedCount = isHydrated ? itemCount : 0;

  const accessibleLabel =
    displayedCount > 0
      ? `Panier, ${displayedCount} formation${
          displayedCount > 1 ? "s" : ""
        }`
      : "Panier vide";

  return (
    <Link
      href="/panier"
      aria-label={accessibleLabel}
      className={[
        "group relative inline-flex items-center justify-center",
        "rounded-xl border border-white/10",
        "bg-white/[0.06] text-white",
        "transition duration-200",
        "hover:border-cyan-400/40",
        "hover:bg-cyan-400/10",
        "hover:text-cyan-100",
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-cyan-400",
        "focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[#061A40]",
        compact
          ? "h-11 w-11"
          : "min-h-11 gap-2 px-4 py-2.5",
        className,
      ].join(" ")}
    >
      <span className="relative flex shrink-0 items-center justify-center">
        <CartIcon />

        {isHydrated && itemCount > 0 ? (
          <span
            aria-hidden="true"
            className={[
              "absolute -right-3 -top-3",
              "flex h-5 min-w-5 items-center justify-center",
              "rounded-full",
              "bg-[#F5B400]",
              "px-1",
              "text-[10px] font-black leading-none",
              "text-[#061A40]",
              "shadow-[0_0_16px_rgba(245,180,0,0.35)]",
            ].join(" ")}
          >
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        ) : null}
      </span>

      {!compact ? (
        <span className="text-sm font-bold">
          Panier
        </span>
      ) : null}
    </Link>
  );
}