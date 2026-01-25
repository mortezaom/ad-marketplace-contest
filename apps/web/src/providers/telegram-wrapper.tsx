// providers/telegram-wrapper.tsx
"use client";

import dynamic from "next/dynamic";
import type { PropsWithChildren } from "react";

const TelegramProvider = dynamic(
  () =>
    import("@/providers/telegram-provider").then((mod) => mod.TelegramProvider),
  { ssr: false },
);

export function TelegramWrapper({ children }: PropsWithChildren) {
  return <TelegramProvider>{children}</TelegramProvider>;
}
