import { create } from "zustand"

interface UploadStore {
  files: Map<string, File>
  deletes: Set<string>
  originalPaths: Map<string, string>
  uploadingForms: Set<string>

  storeFile: (formId: string, fieldName: string, file: File) => void
  clearFile: (formId: string, fieldName: string) => void
  markDelete: (formId: string, fieldName: string, originalPath: string) => void
  setOriginalPath: (formId: string, fieldName: string, path: string) => void
  clearField: (formId: string, fieldName: string) => void
  clearAll: (formId: string) => void
  setUploading: (formId: string, value: boolean) => void
}

const key = (formId: string, fieldName: string) => `${formId}:${fieldName}`

export const useUploadStore = create<UploadStore>((set) => ({
  files: new Map(),
  deletes: new Set(),
  originalPaths: new Map(),
  uploadingForms: new Set(),

  storeFile: (formId, fieldName, file) =>
    set((state) => {
      const files = new Map(state.files)
      files.set(key(formId, fieldName), file)
      return { files }
    }),

  clearFile: (formId, fieldName) =>
    set((state) => {
      const files = new Map(state.files)
      files.delete(key(formId, fieldName))
      return { files }
    }),

  markDelete: (formId, fieldName, originalPath) =>
    set((state) => {
      const deletes = new Set(state.deletes)
      deletes.add(key(formId, fieldName))
      const originalPaths = new Map(state.originalPaths)
      if (originalPath) originalPaths.set(key(formId, fieldName), originalPath)
      return { deletes, originalPaths }
    }),

  setOriginalPath: (formId, fieldName, path) =>
    set((state) => {
      const k = key(formId, fieldName)
      const originalPaths = new Map(state.originalPaths)
      if (!originalPaths.has(k)) originalPaths.set(k, path)
      return { originalPaths }
    }),

  clearField: (formId, fieldName) =>
    set((state) => {
      const k = key(formId, fieldName)
      const files = new Map(state.files)
      const deletes = new Set(state.deletes)
      const originalPaths = new Map(state.originalPaths)
      files.delete(k)
      deletes.delete(k)
      originalPaths.delete(k)
      return { files, deletes, originalPaths }
    }),

  clearAll: (formId) =>
    set((state) => {
      const prefix = `${formId}:`
      const files = new Map(
        [...state.files].filter(([k]) => !k.startsWith(prefix))
      )
      const deletes = new Set(
        [...state.deletes].filter((k) => !k.startsWith(prefix))
      )
      const originalPaths = new Map(
        [...state.originalPaths].filter(([k]) => !k.startsWith(prefix))
      )
      const uploadingForms = new Set(state.uploadingForms)
      uploadingForms.delete(formId)
      return { files, deletes, originalPaths, uploadingForms }
    }),

  setUploading: (formId, value) =>
    set((state) => {
      const uploadingForms = new Set(state.uploadingForms)
      if (value) uploadingForms.add(formId)
      else uploadingForms.delete(formId)
      return { uploadingForms }
    }),
}))

// ─────────────────────────────────────────────
// Reactive selector helpers — use these in components
// so Zustand properly tracks state dependencies
// ─────────────────────────────────────────────

export const selectHasChanges = (formId: string) => (state: UploadStore) => {
  if (!formId) return false
  const prefix = `${formId}:`
  return (
    [...state.files.keys()].some((k) => k.startsWith(prefix)) ||
    [...state.deletes].some((k) => k.startsWith(prefix))
  )
}

export const selectIsUploading = (formId: string) => (state: UploadStore) => {
  if (!formId) return false
  return state.uploadingForms.has(formId)
}
