"use client"

import { useEffect, useState } from "react"

export function useCoarsePointer() {
  const [isCoarse, setIsCoarse] = useState(
    () => window.matchMedia("(pointer: coarse)").matches
  )

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)")
    const handler = (e: MediaQueryListEvent) => setIsCoarse(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return isCoarse
}
