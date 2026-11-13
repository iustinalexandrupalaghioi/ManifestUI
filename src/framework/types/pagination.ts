// Keyset ("seek method") pagination cursor: the sort-column values of the
// last row on the previous page, keyed by the same column identifiers used
// for sorting/filtering. `null` means "first page".
export type Cursor = Record<string, unknown>;
