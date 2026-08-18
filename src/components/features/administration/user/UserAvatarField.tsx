"use client";

import { useQueryClient } from "@tanstack/react-query";
import { currentUserId } from "@/framework/authorization/cache/currentUserId";
import { FileUploadWithPreview } from "@/framework/components/files";
import { useAvatarField } from "@/framework/authentication/hooks/useAvatarField";
import { usersDescriptor } from "./config/descriptor";

function initials(label: string): string {
  const parts = label.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

// The avatar upload/delete endpoints (src/app/api/avatars/[userId]/route.ts)
// are self-only — an admin can view another user's avatar here but can't
// replace or remove it, so upload/delete are only wired up when the record
// being viewed is the signed-in user's own. Picking or deleting a file only
// stages it (see useAvatarField); it's actually sent when the surrounding
// record form is saved, same as any other file field.
export function UserAvatarField({ item }: { item?: Record<string, unknown> }) {
  const id = item?.id as string | undefined;
  const name = (item?.full_name as string) || (item?.email as string) || "";
  const isSelf = !!id && id === currentUserId();
  const queryClient = useQueryClient();

  const { previewUrl, isUploading, handleFilesAdded, handleDelete } =
    useAvatarField(
      {
        id: id ?? "",
        avatar_path: (item?.avatar_path as string) ?? null,
        avatar_url: (item?.avatar_url as string) ?? null,
      },
      () =>
        queryClient.invalidateQueries({ queryKey: usersDescriptor.queryKey }),
    );

  return (
    <FileUploadWithPreview
      src={previewUrl}
      mimeType="image/*"
      filename={`avatar-${id}`}
      alt={name}
      fallback={name ? initials(name) : "?"}
      width={96}
      height={96}
      rounded="rounded-lg"
      accept="image/*"
      disabled={isUploading}
      onFilesAdded={isSelf ? handleFilesAdded : undefined}
      onDelete={isSelf ? handleDelete : undefined}
    />
  );
}
