export interface ResourceActionSurfaces {
  toolbar?: boolean;
  row?: boolean;
}

export type ResourceActionConfig = boolean | ResourceActionSurfaces;

export interface ResolvedResourceAction {
  toolbarEnabled: boolean;
  rowEnabled: boolean;
}

export function resolveResourceAction(
  config: ResourceActionConfig | undefined,
): ResolvedResourceAction {
  if (config === undefined) return { toolbarEnabled: true, rowEnabled: true };
  if (typeof config === "boolean") {
    return { toolbarEnabled: config, rowEnabled: config };
  }
  return {
    toolbarEnabled: config.toolbar !== false,
    rowEnabled: config.row !== false,
  };
}
