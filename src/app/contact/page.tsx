import type { Metadata } from "next";
import { ContactUsView } from "@/components/contact/contact-us-view";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Contact ${site.name} in ${site.location.line}. WhatsApp, phone, email, and the studio form.`,
};

export default function ContactPage() {
  return <ContactUsView />;
}
