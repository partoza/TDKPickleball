"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/solid"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      visibleToasts={1}
      expand={false}
      closeButton
      duration={4000}
      gap={8}
      icons={{
        success: <CheckCircleIcon className="h-5 w-5 text-emerald-500" />,
        error: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
        warning: <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />,
        info: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-foreground group-[.toaster]:text-background group-[.toaster]:border-foreground/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl font-medium",
          description: "group-[.toast]:text-background/80 text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-semibold rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-semibold rounded-md",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
