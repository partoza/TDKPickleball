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
        success: <CheckCircleIcon className="h-5 w-5 text-primary" />,
        error: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
        warning: <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />,
        info: <InformationCircleIcon className="h-5 w-5 text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "mac-toast group toast group-[.toaster]:bg-background/95 group-[.toaster]:text-foreground group-[.toaster]:border-border",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
