"use client";

import { useState } from "react";
import { Check, Copy, Landmark } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { naira } from "@/lib/format";

export function BankCard({
  settings,
  amount,
  reference,
}: {
  settings: StoreSettings;
  amount?: number;
  reference?: string;
}) {
  const [copied, setCopied] = useState(false);
  const wa = settings.whatsapp.replace(/\D/g, "");
  const hasAccount = Boolean(settings.accountNumber);

  if (!hasAccount && !settings.bankName) {
    return (
      <div className="rounded-2xl border border-gold bg-gold-soft p-5 text-sm">
        <p className="font-semibold">Bank account details</p>
        <p className="mt-1 text-ink/70">
          The shop will send you its account details to pay into.
          {wa && (
            <>
              {" "}
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="font-semibold underline">
                Message us on WhatsApp
              </a>{" "}
              to get them straight away.
            </>
          )}
        </p>
      </div>
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(settings.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the number is on screen to copy by hand */
    }
  }

  return (
    <div className="rounded-2xl bg-ink p-5 text-white">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
        <Landmark size={16} /> Pay by bank transfer
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        {settings.bankName && (
          <div>
            <dt className="text-xs text-white/50">Bank</dt>
            <dd className="text-base font-medium">{settings.bankName}</dd>
          </div>
        )}
        {settings.accountName && (
          <div>
            <dt className="text-xs text-white/50">Account name</dt>
            <dd className="text-base font-medium">{settings.accountName}</dd>
          </div>
        )}
        {settings.accountNumber && (
          <div>
            <dt className="text-xs text-white/50">Account number</dt>
            <dd className="mt-0.5 flex items-center gap-3">
              <span className="font-mono text-2xl font-semibold tracking-wider">{settings.accountNumber}</span>
              <button
                type="button"
                onClick={copy}
                className="flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1 text-xs hover:bg-white/10"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>
        )}
        {amount !== undefined && (
          <div>
            <dt className="text-xs text-white/50">Amount to pay</dt>
            <dd className="text-base font-semibold text-gold">{naira(amount)}</dd>
          </div>
        )}
      </dl>

      {reference && (
        <p className="mt-4 text-xs text-white/70">
          Use <b className="text-white">{reference}</b> as your payment reference.
        </p>
      )}
      {settings.bankNote && <p className="mt-3 whitespace-pre-line text-xs text-white/70">{settings.bankNote}</p>}
    </div>
  );
}
