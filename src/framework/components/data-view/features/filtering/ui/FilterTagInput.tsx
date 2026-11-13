"use client"

import { CustomTextarea } from "@/framework/components/ui/CustomTextarea"
import { useState } from "react"
import { useTranslations } from "next-intl"

function splitValues(text: string): string[] {
  return text
    .split(/[\n;,\t]/)
    .map((v) => v.trim())
    .filter(Boolean)
}

interface FilterTagInputProps {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  validate?: (v: string) => boolean
}

export function FilterTagInput({
  value,
  onChange,
  placeholder,
  validate,
}: FilterTagInputProps) {
  const t = useTranslations("Filtering")
  const [error, setError] = useState(false)
  const [text, setText] = useState(value.join("; "))

  const commit = (raw: string) => {
    const lines = splitValues(raw)
    const invalid = lines.some((l) => validate && !validate(l))
    setError(invalid)
    onChange(lines.filter((l) => !validate || validate(l)))
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value
    setText(raw)
    commit(raw)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text")
    const parsed = splitValues(pasted)
    const valid = validate ? parsed.filter(validate) : parsed
    const unique = [...new Set([...value, ...valid])]
    const newText = unique.join("; ")
    setText(newText)
    onChange(unique)
  }

  return (
    <div className="flex flex-col gap-1">
      <CustomTextarea
        value={text}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={placeholder ?? t("valuesSeparatedBySemicolon")}
        className="scrollbar-thumb-rounded scrollbar-thin max-h-60 min-h-24 resize-none overflow-y-auto font-mono text-sm scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80"
      />
      {error && <p className="text-xs text-destructive">{t("mustBeNumber")}</p>}
      <p className="text-xs text-muted-foreground">
        {t("pasteCsvTsvHint")}
      </p>
    </div>
  )
}
