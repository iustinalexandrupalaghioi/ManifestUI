import type { Dispatch, ReactNode, SetStateAction } from "react";
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
  collapsibleClassName?: string;
  collapsibleTriggerClassName?: string;
  plainWrapperClassName?: string;
  formRowLeft?: ReactNode;
  formRowRight?: ReactNode;
  beforeForm?: ReactNode;
  afterForm?: ReactNode;
  afterTabs?: ReactNode;
  form: ReactNode;
  tabs?: ReactNode;
  toolbar?: ReactNode;
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
  toolbar,
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
          toolbar={toolbar}
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
      <FormPage.Title
        className={titleClassName}
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
