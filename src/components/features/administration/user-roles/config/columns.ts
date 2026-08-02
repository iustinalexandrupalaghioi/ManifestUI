import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const userRoleColumns: ColumnConfig[] = [
  { field: "id", label: "Id", type: "text", size: 160, cardHidden: true },
  // Not shown — exists only so the roles→users and users→roles relation
  // tabs can pre-filter by them (see src/components/features/roles/config/
  // relations.ts and src/components/features/users/config/relations.ts).
  { field: "role_id", label: "Role Id", type: "number", hidden: true },
  { field: "user_id", label: "User Id", type: "text", hidden: true },
  {
    field: "user_full_name",
    label: "Full name",
    type: "text",
    size: 180,
    columnName: "full_name",
    origin: "user",
    accessorFn: (row) => row.user?.full_name,
    cardGroup: "user",
    cardGroupLabel: "User",
  },
  {
    field: "user_email",
    label: "Email",
    type: "text",
    size: 220,
    columnName: "email",
    origin: "user",
    accessorFn: (row) => row.user?.email,
    cardGroup: "user",
  },
  {
    field: "role_name",
    label: "Role",
    type: "text",
    size: 200,
    columnName: "name",
    origin: "role",
    accessorFn: (row) => row.role?.name,
  },
  {
    field: "created_at",
    label: "Added",
    type: "datetime",
    size: 140,
    hidden: true,
  },
];
