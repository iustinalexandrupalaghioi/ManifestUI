"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { FormIdContext } from "@/framework/components/form/contexts/FormIdContext";
import { UploadRegistryContext } from "@/framework/registry/UploadRegistryContext";
import {
  useUploadStore,
  selectIsUploading,
} from "@/framework/components/form/hooks/useUploadStore";
import { resolveAvatarUrl } from "../lib/resolveAvatarUrl";

const FIELD_NAME = "avatar_path";

export function useAvatarField(
  profile: {
    id: string;
    avatar_path: string | null;
    avatar_url: string | null;
  },
  onCommitted?: () => void,
) {
  const router = useRouter();
  const registry = useContext(UploadRegistryContext);
  const formId = useContext(FormIdContext);

  const { storeFile, clearFile, markDelete, clearField } = useUploadStore();
  const storedFile = useUploadStore(
    (s) => s.files.get(`${formId}:${FIELD_NAME}`) ?? null,
  );
  const pendingDelete = useUploadStore((s) =>
    s.deletes.has(`${formId}:${FIELD_NAME}`),
  );
  const isUploading = useUploadStore(selectIsUploading(formId));

  const storedFileRef = useRef(storedFile);
  useEffect(() => {
    storedFileRef.current = storedFile;
  }, [storedFile]);
  const pendingDeleteRef = useRef(pendingDelete);
  useEffect(() => {
    pendingDeleteRef.current = pendingDelete;
  }, [pendingDelete]);

  // Local blob preview for a just-picked, not-yet-uploaded file — created
  // and revoked alongside `storedFile` so it can't leak.
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!storedFile) {
      setLocalPreview(null);
      return;
    }
    const url = URL.createObjectURL(storedFile);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [storedFile]);

  const handleFilesAdded = (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    clearField(formId, FIELD_NAME);
    storeFile(formId, FIELD_NAME, f);
  };

  const handleDelete = async () => {
    clearFile(formId, FIELD_NAME);
    markDelete(formId, FIELD_NAME, profile.avatar_path ?? "");
  };

  const syncAfterCommit = () => {
    onCommitted?.();
    router.refresh();
  };

  const handleOperation = async () => {
    const currentFile = storedFileRef.current;

    if (currentFile) {
      const url = `/api/avatars/${profile.id}?filename=${encodeURIComponent(currentFile.name)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": currentFile.type || "application/octet-stream",
        },
        body: currentFile,
      });
      if (!res.ok) throw new Error(`Avatar upload failed: ${res.status}`);
      syncAfterCommit();
      return { action: "none" as const };
    }

    if (pendingDeleteRef.current) {
      const res = await fetch(`/api/avatars/${profile.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Avatar delete failed: ${res.status}`);
      syncAfterCommit();
      return { action: "none" as const };
    }

    return { action: "none" as const };
  };

  const reset = () => clearField(formId, FIELD_NAME);

  if (registry) {
    registry.register(FIELD_NAME, {
      pathField: FIELD_NAME,
      handleOperation,
      reset,
    });
  }
  useEffect(() => {
    return () => registry?.unregister(FIELD_NAME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewUrl = pendingDelete
    ? null
    : (localPreview ?? resolveAvatarUrl(profile));

  return {
    previewUrl,
    isDirty: storedFile !== null || pendingDelete,
    isUploading,
    handleFilesAdded,
    handleDelete,
  };
}
