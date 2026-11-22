import type { Dispatch, ReactNode, SetStateAction } from "react";
import { cn } from "@/framework/lib/utils";
import { FormPage } from "@/framework/components/page/FormPage";
import { DetailFormRow } from "./DetailFormRow";

interface RecordFormNavProps {
  prevPath?: string;
  nextPath?: string;
  firstPath?: string;
  lastPath?: string;
  positionLabel?: string;
  onNavigate?: (path: string) => void;
}

interface RecordFormShellProps {
  hasTabs: boolean;
  isAddScreen?: boolean;
  title: string;
  titleBadge?: ReactNode;
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  navProps?: RecordFormNavProps;
  titleClassName?: string;
  /** The sticky header's background and spacing (dialogs pass their own surface). */
  headerSurfaceClassName?: string;
  collapsibleClassName?: string;
  collapsibleTriggerClassName?: string;
  plainWrapperClassName?: string;
  formRowLeft?: ReactNode;
  formRowRight?: ReactNode;
  beforeForm?: ReactNode;
  afterForm?: ReactNode;
  afterTabs?: ReactNode;
  form: ReactNode;
  /** The tabs, or (with `formInTabs`) a function that puts the title bar in their sticky header. */
  tabs?: ReactNode | ((header: ReactNode) => ReactNode);
  toolbar?: ReactNode;
  /** Every field is in a tab: the title bar, then the tabs (no collapsible form section). */
  formInTabs?: boolean;
}

export function RecordFormShell({
  hasTabs,
  isAddScreen,
  title,
  titleBadge,
  isOpen,
  setOpen,
  navProps,
  titleClassName,
  headerSurfaceClassName,
  collapsibleClassName,
  collapsibleTriggerClassName,
  plainWrapperClassName,
  formRowLeft,
  formRowRight,
  beforeForm,
  afterForm,
  afterTabs,
  form,
  tabs,
  toolbar,
  formInTabs,
}: RecordFormShellProps) {
  if (hasTabs && formInTabs) {
    // The title bar and the tab list stay in view together; only the active tab scrolls.
    const header = (
      <FormPage.Title className={titleClassName} surfaceClassName={cn("static mb-0", headerSurfaceClassName)} toolbar={toolbar} {...navProps}>
        {title}
        {titleBadge}
      </FormPage.Title>
    );
    // With a function the tabs draw the title bar (and toolbar) themselves, so `form` (here only
    // the loading state) goes after them: above, it would show over the toolbar.
    return typeof tabs === "function" ? (
      <>
        {beforeForm}
        {tabs(header)}
        {form}
        {afterTabs}
      </>
    ) : (
      <>
        {header}
        {beforeForm}
        {form}
        {tabs}
        {afterTabs}
      </>
    );
  }

  if (hasTabs) {
    return (
      <>
        {beforeForm}
        <FormPage.Collapsible
          isAddScreen={isAddScreen}
          title={title}
          isOpen={isOpen}
          setOpen={setOpen}
          className={collapsibleClassName}
          triggerClassName={collapsibleTriggerClassName}
          surfaceClassName={headerSurfaceClassName}
          toolbar={toolbar}
          {...navProps}
        >
          <DetailFormRow left={formRowLeft} right={formRowRight}>
            {form}
            {afterForm}
          </DetailFormRow>
        </FormPage.Collapsible>
        {tabs as ReactNode}
        {afterTabs}
      </>
    );
  }

  const plain = (
    <>
      <FormPage.Title
        className={titleClassName}
        surfaceClassName={headerSurfaceClassName}
        toolbar={toolbar}
        {...navProps}
      >
        {title}
        {titleBadge}
      </FormPage.Title>
      <DetailFormRow left={formRowLeft} right={formRowRight}>
        {form}
        {afterForm}
      </DetailFormRow>
      {afterTabs}
    </>
  );

  return (
    <>
      {beforeForm}
      {plainWrapperClassName ? (
        <div className={plainWrapperClassName}>{plain}</div>
      ) : (
        plain
      )}
    </>
  );
}
