"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function useTransitionRouter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function push(path: string) {
    startTransition(() => {
      router.push(path);
    });
  }

  function replace(path: string) {
    startTransition(() => {
      router.replace(path);
    });
  }

  function back() {
    startTransition(() => {
      router.back();
    });
  }

  return { push, replace, back, isPending };
}
