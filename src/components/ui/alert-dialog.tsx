"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  onCancel?: () => void;
  type?: "info" | "success" | "warning" | "error";
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "확인",
  onConfirm,
  cancelText = "취소",
  onCancel,
  type = "info",
}: AlertDialogProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          <DialogDescription className="whitespace-pre-line">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-4 py-2"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            variant={type === "error" ? "destructive" : "default"}
            className="px-4 py-2"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useAlertDialog() {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    onConfirm?: () => void;
    cancelText?: string;
    onCancel?: () => void;
    type?: "info" | "success" | "warning" | "error";
  }>({
    isOpen: false,
    message: "",
  });

  const showAlert = React.useCallback(
    (options: Omit<AlertDialogProps, "isOpen" | "onClose">) => {
      setDialog({ ...options, isOpen: true });
    },
    []
  );

  const hideAlert = React.useCallback(() => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const AlertDialogComponent = React.useMemo(
    () => <AlertDialog {...dialog} onClose={hideAlert} />,
    [dialog, hideAlert]
  );

  return { showAlert, AlertDialogComponent };
}
