import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type ConfirmDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  cancelVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  isLoading?: boolean;
  onConfirm?: () => Promise<void>;
  footer?: boolean;
  preventAutoFocus?: boolean;
  confirmButtonType?: 'button' | 'submit';
  className?: string;
  children?: React.ReactNode;
};

export default function ConfirmDialog({
  open,
  setOpen,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  cancelVariant = 'destructive',
  confirmVariant = 'default',
  isLoading = false,
  onConfirm = async () => {},
  footer = true,
  preventAutoFocus = true,
  confirmButtonType = 'button',
  className,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={className}
        onOpenAutoFocus={preventAutoFocus ? (event) => event.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-left">{title}</DialogTitle>
          <DialogDescription className="text-left">{description}</DialogDescription>
        </DialogHeader>

        {children}

        {footer && (
          <DialogFooter className="gap-2 space-x-2 sm:gap-0">
            <Button
              variant={cancelVariant}
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {cancelText}
            </Button>
            <Button
              variant={confirmVariant}
              onClick={async () => await onConfirm()}
              disabled={isLoading}
              type={confirmButtonType}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? (
                <i className="fa-solid fa-spinner mr-2 animate-spin" aria-hidden="true" />
              ) : null}
              {confirmText}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
