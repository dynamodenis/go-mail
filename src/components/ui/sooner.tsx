import {
    AlertCircleIcon,
    CheckCircleIcon,
    InfoIcon,
    LoaderIcon,
    TriangleAlertIcon,
    XIcon,
  } from "lucide-react";
  import { type ReactNode, useEffect, useRef } from "react";
  import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
  
  import { cn } from "@/lib/utils";
  
  type ToastVariant = "default" | "success" | "error" | "warning" | "info";
  
  interface ToastProps {
    id: string | number;
    title: string;
    description?: string;
    variant?: ToastVariant;
    action?: {
      label: string;
      onClick: () => void;
    };
    cancel?: {
      label: string;
      onClick?: () => void;
    };
    icon?: ReactNode;
    dismissOnClickOutside?: boolean;
  }
  
  const variantStyles: Record<
    ToastVariant,
    {
      container: string;
      icon: string;
      iconElement: ReactNode;
      actionButton?: string;
    }
  > = {
    default: {
      container:
        "bg-st-middleground-base-light/95 border-st-stroke-transparent-base-light backdrop-blur-md",
      icon: "text-foreground",
      iconElement: <InfoIcon className="size-4" />,
    },
    success: {
      container:
        "bg-st-middleground-base-light/95 border-emerald-500/30 backdrop-blur-md",
      icon: "text-emerald-400",
      iconElement: <CheckCircleIcon className="size-4" />,
    },
    error: {
      container:
        "bg-st-middleground-base-light/95 border-red-500/30 backdrop-blur-md",
      icon: "text-red-400",
      iconElement: <AlertCircleIcon className="size-4" />,
    },
    warning: {
      container:
        "bg-st-middleground-base-light/95 border-amber-500/30 backdrop-blur-md",
      icon: "text-amber-400",
      iconElement: <TriangleAlertIcon className="size-4" />,
      actionButton: "bg-destructive/10 hover:bg-destructive/20 text-destructive",
    },
    info: {
      container:
        "bg-st-middleground-base-light/95 border-blue-500/30 backdrop-blur-md",
      icon: "text-blue-400",
      iconElement: <InfoIcon className="size-4" />,
    },
  };
  
  function Toast({
    id,
    title,
    description,
    variant = "default",
    action,
    cancel,
    icon,
    dismissOnClickOutside,
  }: ToastProps) {
    const styles = variantStyles[variant];
    const toastRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      if (!dismissOnClickOutside) return;
  
      const handleClickOutside = (event: MouseEvent) => {
        // Check if click is inside any toast using coordinates
        const toasts = document.querySelectorAll("[data-sonner-toast]");
        const x = event.clientX;
        const y = event.clientY;
  
        for (const toast of toasts) {
          const rect = toast.getBoundingClientRect();
          if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
          ) {
            // Click is inside a toast, don't dismiss
            return;
          }
        }
  
        sonnerToast.dismiss(id);
      };
  
      // Delay adding the listener to prevent immediate dismissal from the triggering click
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 100);
  
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleClickOutside);
      };
    }, [id, dismissOnClickOutside]);
  
    return (
      <div
        ref={toastRef}
        className={cn(
          "flex w-full items-center gap-2 rounded-md border px-3 py-2 shadow-md",
          styles.container,
        )}
      >
        <div className={cn("shrink-0", styles.icon)}>
          {icon ?? styles.iconElement}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="font-medium text-foreground text-xs leading-snug">
            {title}
          </p>
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
          {(action || cancel) && (
            <div className="mt-1 flex items-center gap-2">
              {action && (
                <button
                  type="button"
                  onClick={() => {
                    action.onClick();
                    sonnerToast.dismiss(id);
                  }}
                  className={cn(
                    "rounded px-2 py-1 font-medium text-xs transition-colors",
                    styles.actionButton ??
                      "border border-st-stroke-solid-orbiter-dark bg-st-middleground-base-light text-foreground hover:bg-st-hover-base-light",
                  )}
                >
                  {action.label}
                </button>
              )}
              {cancel && (
                <button
                  type="button"
                  onClick={() => {
                    cancel.onClick?.();
                    sonnerToast.dismiss(id);
                  }}
                  className="rounded border border-st-stroke-transparent-base-light bg-st-middleground-base-light px-2 py-1 font-medium text-muted-foreground text-xs transition-colors hover:bg-st-hover-base-light hover:text-foreground"
                >
                  {cancel.label}
                </button>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => sonnerToast.dismiss(id)}
          className="-m-0.5 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-st-hover-base-light hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
    );
  }

  function PromiseToast({
    id,
    title,
    description,
    state,
  }: {
    id: string | number;
    title: string;
    description?: string;
    state: "loading" | "success" | "error";
  }) {
    const stateConfig = {
      loading: {
        icon: <LoaderIcon className="size-4 animate-spin" />,
        containerClass:
          "bg-st-middleground-base-light/95 border-st-stroke-transparent-base-light backdrop-blur-md",
        iconClass: "text-muted-foreground",
      },
      success: {
        icon: <CheckCircleIcon className="size-4" />,
        containerClass:
          "bg-st-middleground-base-light/95 border-emerald-500/30 backdrop-blur-md",
        iconClass: "text-emerald-400",
      },
      error: {
        icon: <AlertCircleIcon className="size-4" />,
        containerClass:
          "bg-st-middleground-base-light/95 border-red-500/30 backdrop-blur-md",
        iconClass: "text-red-400",
      },
    };
  
    const config = stateConfig[state];
  
    return (
      <div
        className={cn(
          "flex w-full items-center gap-2 rounded-md border px-3 py-2 shadow-md",
          config.containerClass,
        )}
      >
        <div className={cn("shrink-0", config.iconClass)}>
          {config.icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="font-medium text-foreground text-xs leading-snug">
            {title}
          </p>
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
        </div>
        {state !== "loading" && (
          <button
            type="button"
            onClick={() => sonnerToast.dismiss(id)}
            className="-m-0.5 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-st-hover-base-light hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
    );
  }
  
  export function Toaster() {
    return (
      <div
        id="sonner-portal"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <SonnerToaster
            position="bottom-right"
            gap={8}
            toastOptions={{
              unstyled: true,
              classNames: {
                toast: "w-full max-w-[300px]",
              },
            }}
          />
        </div>
      </div>
    );
  }
  
  type ToastOptions = Omit<ToastProps, "id"> & {
    duration?: number;
  };
  
  export const toast = {
    show: ({ duration, ...options }: ToastOptions) => {
      return sonnerToast.custom((id) => <Toast id={id} {...options} />, {
        duration,
      });
    },
  
    success: (title: string, options?: Omit<ToastOptions, "title" | "variant">) =>
      sonnerToast.custom((id) => (
        <Toast id={id} title={title} variant="success" {...options} />
      )),
  
    error: (title: string, options?: Omit<ToastOptions, "title" | "variant">) =>
      sonnerToast.custom((id) => (
        <Toast id={id} title={title} variant="error" {...options} />
      )),
  
    warning: (title: string, options?: Omit<ToastOptions, "title" | "variant">) =>
      sonnerToast.custom((id) => (
        <Toast id={id} title={title} variant="warning" {...options} />
      )),
  
    info: (title: string, options?: Omit<ToastOptions, "title" | "variant">) =>
      sonnerToast.custom((id) => (
        <Toast id={id} title={title} variant="info" {...options} />
      )),
  
    promise: <T,>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
        description?: {
          loading?: string;
          success?: string | ((data: T) => string);
          error?: string | ((error: unknown) => string);
        };
      },
    ) => {
      let toastId: string | number;
  
      toastId = sonnerToast.custom(
        (id) => (
          <PromiseToast
            id={id}
            title={options.loading}
            description={options.description?.loading}
            state="loading"
          />
        ),
        { duration: Number.POSITIVE_INFINITY },
      );
  
      promise
        .then((data) => {
          const title =
            typeof options.success === "function"
              ? options.success(data)
              : options.success;
          const description =
            typeof options.description?.success === "function"
              ? options.description.success(data)
              : options.description?.success;
  
          sonnerToast.custom(
            (id) => (
              <PromiseToast
                id={id}
                title={title}
                description={description}
                state="success"
              />
            ),
            { id: toastId },
          );
        })
        .catch((error) => {
          const title =
            typeof options.error === "function"
              ? options.error(error)
              : options.error;
          const description =
            typeof options.description?.error === "function"
              ? options.description.error(error)
              : options.description?.error;
  
          sonnerToast.custom(
            (id) => (
              <PromiseToast
                id={id}
                title={title}
                description={description}
                state="error"
              />
            ),
            { id: toastId },
          );
        });
  
      return toastId;
    },
  
    dismiss: sonnerToast.dismiss,
  };
  