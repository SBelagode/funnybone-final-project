"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.some((toast) => toast.open) && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-background/50 z-[99]"
          onClick={() => {
            toasts.forEach((toast) => {
              if (toast.open) {
                toast.onOpenChange?.(false);
              }
            });
          }}
        />
      )}
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-2">
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            <div className="flex justify-end mt-2">
              {action || (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => props.onOpenChange?.(false)}
                >
                  Ok
                </Button>
              )}
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
