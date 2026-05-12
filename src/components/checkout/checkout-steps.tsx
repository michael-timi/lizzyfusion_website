import Link from "next/link";

export type CheckoutStepId = "cart" | "info" | "shipping" | "payment";

const steps: { id: CheckoutStepId; label: string; href: string }[] = [
  { id: "cart", label: "Cart", href: "/cart" },
  { id: "info", label: "Info", href: "/checkout/info" },
  { id: "shipping", label: "Shipping", href: "/checkout/shipping" },
  { id: "payment", label: "Payment", href: "/checkout/payment" },
];

export function CheckoutSteps({ active }: { active: CheckoutStepId }) {
  return (
    <nav className="text-sm text-zinc-500" aria-label="Checkout progress">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {steps.map((s, i) => (
          <li key={s.id} className="flex items-center">
            {i > 0 ? <span className="mx-1.5 text-zinc-300" aria-hidden>/</span> : null}
            {s.id === active ? (
              <span className="font-semibold text-[var(--lf-ink)]">{s.label}</span>
            ) : (
              <Link href={s.href} className="transition hover:text-[var(--lf-purple)]">
                {s.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
