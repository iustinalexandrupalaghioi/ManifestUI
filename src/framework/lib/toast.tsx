import { toast, type ExternalToast, type ToastT } from "sonner"

type Position = ToastT["position"]

export const toastSuccess = (msg: string, position: Position = "top-center") =>
  toast.success(msg, { position })

export const toastError = (msg: string, position: Position = "top-center") =>
  toast.error(msg, { position })

export const toastLoading = (
  msg: string,
  position: Position = "top-center"
): string | number => toast.loading(msg, { position })

export const dismissToast = (id: string | number) => toast.dismiss(id)

// Updates an in-flight loading toast's text in place (same `id`), for
// ticking progress ("Deleting 3 of 10 todos...") without flashing a new toast.
export const toastLoadingUpdate = (
  id: string | number,
  msg: string,
  position: Position = "top-center"
) => toast.loading(msg, { id, position })

export const toastUpdate = (
  id: string | number,
  type: "success" | "error",
  msg: string,
  position: Position = "top-center"
) => {
  const options: ExternalToast = { id, duration: 3000, position }
  if (type === "success") toast.success(msg, options)
  else toast.error(msg, options)
}
