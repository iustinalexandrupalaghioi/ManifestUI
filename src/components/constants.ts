// rbac has no /cms URL prefix (the CMS is the whole app, at "/") — kept as
// its own constant, matching manifestui-next's BASE_ROUTE shape, so resource
// descriptors ported from there only need their import path changed.
export const BASE_ROUTE = "";
