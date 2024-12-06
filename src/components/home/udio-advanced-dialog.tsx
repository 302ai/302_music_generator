import UdioAdvancedForm from "@/components/forms/tabs/udio-advanced-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

type UdioAdvancedDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function UdioAdvancedDialog({
  open,
  onClose,
}: UdioAdvancedDialogProps) {
  const t = useTranslations("edit.form.dialog.udio_advanced");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl pb-10" ref={dialogRef} tabIndex={-1}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <UdioAdvancedForm />
      </DialogContent>
    </Dialog>
  );
}
