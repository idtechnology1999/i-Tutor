/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend address, e.g. https://itutor-api.onrender.com. Empty = demo mode. */
  readonly VITE_API_URL?: string;
  /** Paystack public key (pk_…) for the checkout popup. Never the secret key. */
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
