"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XMarkIcon as X } from "@heroicons/react/24/solid"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    data-slot="dialog-overlay"
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const componentName = (child: React.ReactNode) => {
  if (!React.isValidElement(child) || typeof child.type === "string") return ""
  return (child.type as React.ComponentType).displayName || (child.type as React.ComponentType).name || ""
}

const containsDialogFooter = (children: React.ReactNode): boolean => React.Children.toArray(children).some(child => {
  if (!React.isValidElement<{ children?: React.ReactNode; "data-slot"?: string }>(child)) return false
  if (componentName(child) === "DialogFooter" || child.props["data-slot"] === "dialog-footer") return true
  return containsDialogFooter(child.props.children)
})

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const childList = React.Children.toArray(children)
  const header = childList.filter(child => componentName(child) === "DialogHeader")
  const footer = childList.filter(child => componentName(child) === "DialogFooter")
  const body = childList.filter(child => !["DialogHeader", "DialogFooter"].includes(componentName(child)))
  const usesSharedSections = header.length > 0 || footer.length > 0
  const hasFooter = containsDialogFooter(children)

  return <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      data-slot="dialog-content"
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card p-0 font-sans text-card-foreground shadow-[0_24px_80px_-24px_rgba(0,0,0,.45)] duration-200 dark:border-white/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      {usesSharedSections ? <>
        {header}
        {body.length > 0 && <div data-slot="dialog-body" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">{body}</div>}
        {footer}
      </> : children}
      {!hasFooter && <DialogFooter>
        <DialogPrimitive.Close asChild><Button type="button" variant="outline">Close</Button></DialogPrimitive.Close>
      </DialogFooter>}
      <DialogPrimitive.Close data-slot="dialog-close" className="absolute right-4 top-4 z-30 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-[color,background-color,transform,box-shadow] duration-150 hover:bg-muted hover:text-foreground active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-header"
    className={cn(
      "sticky top-0 z-20 flex shrink-0 flex-col space-y-1.5 border-b border-border/70 bg-card px-6 py-5 pr-14 text-left dark:border-white/10",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-footer"
    className={cn(
      "sticky bottom-0 z-20 flex shrink-0 flex-col-reverse gap-2 border-t border-border/70 bg-muted/35 px-6 py-4 sm:flex-row sm:justify-end dark:border-white/10 dark:bg-black/10",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-bold leading-tight tracking-[-0.02em] text-foreground",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
