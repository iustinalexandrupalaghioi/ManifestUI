"use client";

import { useQueryClient } from "@tanstack/react-query";
import { currentUserId } from "@/framework/authorization/cache/currentUserId";
import { FileUploadWithPreview } from "@/framework/components/files";
import { useAvatarField } from "@/framework/authentication/hooks/useAvatarField";
import { ImageIcon } from "lucide-react";
import { z } from "zod";
import { defineBlockComponent } from "@/framework/extensions";


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
function UserAvatarField({ item, queryKey }: { item?: Record<string, unknown>; queryKey: string }) {
  const id = item?.id as string | undefined;
  const name = (item?.fullName as string) || (item?.email as string) || "";
  const isSelf = !!id && id === currentUserId();
  const queryClient = useQueryClient();

  const { previewUrl, isUploading, handleFilesAdded, handleDelete } =
    useAvatarField(
      {
        id: id ?? "",
        avatar_path: (item?.avatarPath as string) ?? null,
        avatar_url: (item?.avatarUrl as string) ?? null,
      },
      () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
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

/**
 * The user's avatar beside their record (Form Designer: a block). Upload and delete only on
 * your own record; the endpoints are self-only too.
 */
export const userAvatarBlock = defineBlockComponent({
  type: "userAvatar",
  label: { en: "User avatar", ro: "Avatarul utilizatorului" },
  icon: ImageIcon,
  props: z.object({
    resource: z.string().default("users").describe("The users resource id, its list refreshed after a change"),
  }),
  component: function UserAvatar({ item, props }) {
    return <UserAvatarField item={item} queryKey={props.resource} />;
  },
});
