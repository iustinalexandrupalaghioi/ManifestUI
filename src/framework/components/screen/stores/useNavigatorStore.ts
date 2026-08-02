import { create } from "zustand";

export const EMPTY_NAVIGATOR_IDS: string[] = [];

interface NavigatorStore {
  byKey: Record<string, string[]>;
  originByKey: Record<string, string>;
  set: (ids: string[], overviewKey: string, originPath?: string) => void;
  clear: (overviewKey: string) => void;
  get: (overviewKey: string) => string[];
  getOrigin: (overviewKey: string) => string | undefined;
}

export const useNavigatorStore = create<NavigatorStore>((set, get) => ({
  byKey: {},
  originByKey: {},
  set: (ids, overviewKey, originPath) =>
    set((s) => ({
      byKey: { ...s.byKey, [overviewKey]: ids },
      originByKey: originPath
        ? { ...s.originByKey, [overviewKey]: originPath }
        : s.originByKey,
    })),
  clear: (overviewKey) =>
    set((s) => {
      if (!(overviewKey in s.byKey) && !(overviewKey in s.originByKey))
        return s;
      const { [overviewKey]: _removedIds, ...restIds } = s.byKey;
      const { [overviewKey]: _removedOrigin, ...restOrigin } = s.originByKey;
      return { byKey: restIds, originByKey: restOrigin };
    }),
  get: (overviewKey) => get().byKey[overviewKey] ?? [],
  getOrigin: (overviewKey) => get().originByKey[overviewKey],
}));
