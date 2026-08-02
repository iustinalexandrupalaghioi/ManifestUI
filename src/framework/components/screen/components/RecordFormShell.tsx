import type { Dispatch, ReactNode, SetStateAction } from "react";
import { FormPage } from "@/framework/components/page/FormPage";
import { DetailFormRow } from "./DetailFormRow";

interface RecordFormNavProps {
  prevPath?: string;
  nextPath?: string;
  firstPath?: string;
  lastPath?: string;
  positionLabel?: string;
}

interface RecordFormShellProps {
  /** Whether to render the collapsible-header + tabs layout, or the plain
   *  title + form layout. Both createDetailPage/createAddPage and their
   *  dialog counterparts branch on this the same way — this component is
   *  that branch, written once. */
  hasTabs: boolean;
  isAddScreen?: boolean;
  title: string;
  /** Extra content appended after the title — only used in the plain
   *  (non-tabbed) layout today, e.g. the "(new item)" badge. */
  titleBadge?: ReactNode;
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  navProps?: RecordFormNavProps;
  /** className passed to FormPage.Title (plain layout) or FormPage.Collapsible
   *  (tabbed layout) — e.g. the dialog variants' "dark:bg-card". */
  titleClassName?: string;
  /** className passed to FormPage.Collapsible specifically (tabbed layout
   *  only) — separate from titleClassName because the dialog variants style
   *  the collapsible's own padding independently of its trigger. */
  collapsibleClassName?: string;
  collapsibleTriggerClassName?: string;
  /** Wraps title+form together in the plain (non-tabbed) layout. Unset by
   *  default (matches the page variants, which pad at the page level
   *  instead) — the detail dialog sets this to add its own padding. */
  plainWrapperClassName?: string;
  formRowLeft?: ReactNode;
  formRowRight?: ReactNode;
  beforeForm?: ReactNode;
  afterForm?: ReactNode;
  afterTabs?: ReactNode;
  /** The <Form .../> element, already configured by the caller. */
  form: ReactNode;
  /** The <RecordTabs .../> or <AddTabs .../> element. Only rendered when
   *  hasTabs is true. */
  tabs?: ReactNode;
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
}: RecordFormShellProps) {
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
          {...navProps}
        >
          <DetailFormRow left={formRowLeft} right={formRowRight}>
            {form}
            {afterForm}
          </DetailFormRow>
        </FormPage.Collapsible>
        {tabs}
        {afterTabs}
      </>
    );
  }

  const plain = (
    <>
      <FormPage.Title className={titleClassName} {...navProps}>
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
