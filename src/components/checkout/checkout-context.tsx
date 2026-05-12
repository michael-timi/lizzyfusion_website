"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "lizzy-fusion-checkout-v1";

export type CheckoutFormState = {
  email: string;
  marketingOptIn: boolean;
  firstName: string;
  lastName: string;
  company: string;
  country: string;
  address: string;
  apartment: string;
  postal: string;
  city: string;
  phone: string;
  saveInfo: boolean;
  shippingMethod: "standard" | "express";
  deliveryDate: string;
  sameBilling: boolean;
  billingName: string;
  billingEmail: string;
  billingCountry: string;
  billingAddress1: string;
  billingAddress2: string;
  billingCity: string;
  billingPostal: string;
  billingPhone: string;
  cardNumber: string;
  cardMonth: string;
  cardYear: string;
  cardCvv: string;
};

const defaultForm: CheckoutFormState = {
  email: "",
  marketingOptIn: false,
  firstName: "",
  lastName: "",
  company: "",
  country: "Nigeria",
  address: "",
  apartment: "",
  postal: "",
  city: "",
  phone: "",
  saveInfo: false,
  shippingMethod: "standard",
  deliveryDate: "",
  sameBilling: true,
  billingName: "",
  billingEmail: "",
  billingCountry: "Nigeria",
  billingAddress1: "",
  billingAddress2: "",
  billingCity: "",
  billingPostal: "",
  billingPhone: "",
  cardNumber: "",
  cardMonth: "",
  cardYear: "",
  cardCvv: "",
};

function loadForm(): CheckoutFormState {
  if (typeof window === "undefined") return defaultForm;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultForm;
    const o = JSON.parse(raw) as Partial<CheckoutFormState>;
    return { ...defaultForm, ...o };
  } catch {
    return defaultForm;
  }
}

function persistForm(s: CheckoutFormState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

type CheckoutContextValue = {
  form: CheckoutFormState;
  patchForm: (p: Partial<CheckoutFormState>) => void;
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<CheckoutFormState>(defaultForm);

  useEffect(() => {
    startTransition(() => {
      setForm(loadForm());
    });
  }, []);

  const patchForm = useCallback((p: Partial<CheckoutFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...p };
      persistForm(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ form, patchForm }), [form, patchForm]);

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckoutForm() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckoutForm must be used within CheckoutProvider");
  return ctx;
}
