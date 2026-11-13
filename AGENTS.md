<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## CMS Framework Notes

- Build CMS resources with `defineResource<TItem, TFormValues>`. Infer persisted row types from Drizzle (`typeof table.$inferSelect`); use a separate joined type only when a query returns related/computed data. Derive form values from the Zod schema.
- Resource data views have separate `overview` and `pickup` configs. Both support `dataTableColumns` and `dataListColumns`; provide the list columns wherever cards should be available. Table and list columns are merged by column ID, so keep IDs/fields aligned and retain relationship keys even when hidden.
- Forms use `FormConfig` sections with responsive `cols`, optional per-section `responsiveCols` breakpoints, and per-field `span`. `className` controls the form's width; avoid restrictive max-widths for long resource forms. Group related fields and use more columns for compact numeric fields.
- Relationship pickup fields use `resource`, `mapField`, and `targetField`; `embeddedField` can provide the selected relation immediately on detail forms, and `fillFields` can display or copy related values.
- `FormInput` converts non-empty number inputs to numbers and cleared inputs to empty strings; field validation errors are shown immediately. Normalize empty numeric input in resource schemas before number validation, and avoid `z.coerce.number()` when an empty value must not become zero. Numeric money fields may accept number input but should parse to strings for Drizzle numeric columns.
- Drizzle is configured with `casing: "snake_case"`; keep TypeScript property names camelCase and database column names snake_case.
- Extend the framework through `@/framework/extensions`, not ad-hoc render functions: `defineFieldComponent` (bound to one form value), `defineBlockComponent` (form section with the whole form), `defineDetailComponent` (detail slots/tabs), `defineOverviewComponent` (overview slots). Register them in `src/extensions/index.ts`; configs reference them as `{ type, props }` (or `def.with(props)`), with `props` validated by the zod schema that also describes their editor controls.
- Default data views are config, not code: `dataView.overview.defaultView`, `dataView.overview.navigationView` (embedded/relation lists) and `dataView.pickup.defaultView` set initial sorting, filters, pinning, column order and widths per grid/cards; column arrays (order, `size`, `hidden`, `navigationHidden`, `pickupHidden`) set the base layout.
