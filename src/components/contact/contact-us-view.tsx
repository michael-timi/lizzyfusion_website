"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { CraftCareBreadcrumb } from "@/components/craft-care/craft-care-breadcrumb";
import { mailtoHref, site, whatsappHref } from "@/lib/site";

const subjects = [
  { value: "", label: "Select a subject" },
  { value: "General enquiry", label: "General enquiry" },
  { value: "Order & shipping", label: "Order & shipping" },
  { value: "Bespoke / fitting", label: "Bespoke / fitting" },
  { value: "Returns & alterations", label: "Returns & alterations" },
  { value: "Press / wholesale", label: "Press / wholesale" },
] as const;

function IconEnvelope({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v12H4V6Zm8 6 8-5H4l8 5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChat({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A7.7 7.7 0 0 1 5 12a8 8 0 0 1 8-8h6a6 6 0 0 1 2 11.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHeadset({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 11a7 7 0 0 1 14 0v3H5v-3Zm4 7h6M12 5v2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const underline =
  "mt-2 w-full border-0 border-b border-zinc-300 bg-transparent py-2.5 text-sm text-[var(--lf-ink)] outline-none transition placeholder:text-zinc-400 focus:border-[var(--lf-purple)]";

export function ContactUsView() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [privacy, setPrivacy] = useState(false);

  const chatHref = useMemo(
    () =>
      whatsappHref(
        `Hello ${site.name}, I would like to chat from your Contact page.\n\nName: ${fullName || "—"}`,
      ),
    [fullName],
  );

  const telHref = `tel:+${site.contact.phoneWa}`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!privacy || !subject) return;
    const body = [
      `Name: ${fullName || "(not provided)"}`,
      `Reply email: ${email || "(not provided)"}`,
      `Order / reference: ${orderNumber || "N/A"}`,
      "",
      message || "(no message body)",
      "",
      `_Sent via ${site.name} contact form_`,
    ].join("\n");
    window.location.href = mailtoHref(subject, body);
  };

  return (
    <main className="bg-white pb-24">
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:max-w-[960px] lg:py-12">
        <CraftCareBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact us" }]} />

        <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-5xl">
          Contact us
        </h1>

        <div className="mt-10 bg-zinc-100 px-6 py-10 text-center sm:px-10 sm:py-12">
          <p className="text-sm leading-relaxed text-[var(--lf-ink)] sm:text-[15px]">
            Our customer care team reads every message from this page. For the fastest reply on orders, fittings, and
            fabric questions, use WhatsApp or call the studio line below—we typically respond within one to two hours.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--lf-ink)] sm:text-[15px]">
            You can also write to{" "}
            <a href={`mailto:${site.contact.email}`} className="font-semibold text-[var(--lf-purple-deep)] underline-offset-2 hover:underline">
              {site.contact.email}
            </a>
            . If your browser supports it, the form opens a draft in your email app with your details filled in.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--lf-muted)] sm:text-[15px]">
            Studio: {site.location.line}
          </p>
        </div>

        <section className="mt-14">
          <div className="flex items-center gap-2 text-[var(--lf-ink)]">
            <IconEnvelope className="shrink-0 text-[var(--lf-purple-deep)]" />
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Write us</h2>
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--lf-ink)]">Your information</p>

          <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
            <label className="block text-sm text-[var(--lf-muted)]">
              Full name
              <input
                className={underline}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="block text-sm text-[var(--lf-muted)]">
              Email
              <input
                type="email"
                className={underline}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm text-[var(--lf-muted)]">
              Subject
              <select
                className={`${underline} cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.1rem_center] bg-no-repeat pr-8`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
                }}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              >
                {subjects.map((s, i) => (
                  <option key={s.value || "placeholder"} value={s.value} disabled={i === 0}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-[var(--lf-muted)]">
              Order number <span className="font-normal text-zinc-400">(optional)</span>
              <input className={underline} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
            </label>
            <label className="block text-sm text-[var(--lf-muted)]">
              Message
              <textarea
                className={`${underline} min-h-[8rem] resize-y`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </label>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--lf-muted)]">
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
                className="mt-1 accent-[var(--lf-purple)]"
                required
              />
              <span>
                I have read and understood the{" "}
                <Link href="/policies" className="font-medium text-[var(--lf-purple-deep)] underline-offset-2 hover:underline">
                  privacy &amp; policies
                </Link>
                .
              </span>
            </label>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!privacy || !subject}
                className="min-w-[8rem] bg-[var(--lf-purple-deep)] px-10 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </form>
        </section>

        <ul className="mt-16 grid gap-4 sm:grid-cols-3 sm:gap-5">
          <li className="border border-[var(--lf-line)] bg-zinc-100 px-5 py-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-[var(--lf-ink)]">
              <IconChat />
            </div>
            <h3 className="mt-5 text-sm font-semibold text-[var(--lf-ink)]">Chat with us</h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--lf-muted)]">We are here and ready to chat on WhatsApp.</p>
            <a
              href={chatHref}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center border border-[var(--lf-ink)] bg-white py-2.5 text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple-deep)]"
            >
              Start chat
            </a>
          </li>
          <li className="border border-[var(--lf-line)] bg-zinc-100 px-5 py-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-[var(--lf-ink)]">
              <IconHeadset />
            </div>
            <h3 className="mt-5 text-sm font-semibold text-[var(--lf-ink)]">Call us</h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--lf-muted)]">We are here to talk you through your order.</p>
            <a
              href={telHref}
              className="mt-6 inline-flex w-full items-center justify-center border border-[var(--lf-ink)] bg-white py-2.5 text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple-deep)]"
            >
              {site.contact.phoneDisplay}
            </a>
          </li>
          <li className="border border-[var(--lf-line)] bg-zinc-100 px-5 py-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-[var(--lf-ink)]">
              <IconEnvelope />
            </div>
            <h3 className="mt-5 text-sm font-semibold text-[var(--lf-ink)]">Email us</h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--lf-muted)]">You are welcome to send us an email directly.</p>
            <a
              href={mailtoHref(
                `Hello ${site.name}`,
                `I am reaching out from the Contact page.\n\n`,
              )}
              className="mt-6 inline-flex w-full items-center justify-center border border-[var(--lf-ink)] bg-white py-2.5 text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple-deep)]"
            >
              Send email
            </a>
          </li>
        </ul>
      </div>

      <a
        href={whatsappHref(`Hello ${site.name}, I have a quick question from your website.`)}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 flex h-14 w-14 items-center justify-center rounded-sm bg-[var(--lf-purple-deep)] text-white shadow-lg transition hover:bg-[var(--lf-purple)] sm:bottom-[max(2rem,env(safe-area-inset-bottom))] sm:right-[max(2rem,env(safe-area-inset-right))]"
        aria-label="Open WhatsApp chat"
      >
        <IconChat className="text-white" />
      </a>
    </main>
  );
}
