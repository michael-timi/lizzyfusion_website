"use client";

import { useMemo, useState } from "react";
import { trackGenerateLead } from "@/lib/analytics-events";
import { mailtoHref, site, whatsappHref } from "@/lib/site";

type LeadFormProps = {
  intent: string;
  /** Extra lines appended after the structured block */
  extraFields?: { key: string; label: string; type?: "text" | "textarea" }[];
};

export function LeadForm({ intent, extraFields = [] }: LeadFormProps) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});

  const message = useMemo(() => {
    const lines = [
      `*${site.name} — website enquiry*`,
      `Intent: ${intent}`,
      `Name: ${name || "(not provided)"}`,
      `WhatsApp: ${whatsapp || "(not provided)"}`,
      `City / country: ${city || "(not provided)"}`,
      ...extraFields.map((f) => `${f.label}: ${extras[f.key] ?? "(not provided)"}`),
      "",
      "_Sent from website form_",
    ];
    return lines.join("\n");
  }, [intent, name, whatsapp, city, extras, extraFields]);

  const wa = whatsappHref(message);
  const mail = mailtoHref(`Website: ${intent}`, message);

  return (
    <form
      className="space-y-4 rounded-2xl border border-[var(--lf-line)] bg-white p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        void trackGenerateLead("lead_form", intent);
        window.open(wa, "_blank", "noopener,noreferrer");
      }}
    >
      <Field label="Full name" required>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
      </Field>
      <Field label="WhatsApp number" required>
        <input
          className="input"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          inputMode="tel"
          placeholder="e.g. 0803 … or +234 …"
          required
        />
      </Field>
      <Field label="City / country">
        <input
          className="input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Ibadan, Nigeria"
        />
      </Field>
      {extraFields.map((f) => (
        <Field key={f.key} label={f.label}>
          {f.type === "textarea" ? (
            <textarea
              className="input min-h-[100px] resize-y"
              value={extras[f.key] ?? ""}
              onChange={(e) =>
                setExtras((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            />
          ) : (
            <input
              className="input"
              value={extras[f.key] ?? ""}
              onChange={(e) =>
                setExtras((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            />
          )}
        </Field>
      ))}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <button type="submit" className="btn-primary">
          Continue on WhatsApp
        </button>
        <a href={mail} className="btn-secondary text-center">
          Email instead
        </a>
      </div>
      <p className="text-xs text-zinc-500">
        Submitting opens WhatsApp with your details filled in so the team can reply
        with the same context. You can edit the message before sending.
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
