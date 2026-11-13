"use client"

import { createContext, useContext } from "react"

export const FormIdContext = createContext<string>("")

export function useFormId(): string {
  return useContext(FormIdContext)
}
