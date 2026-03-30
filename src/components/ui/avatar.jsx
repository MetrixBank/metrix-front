"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props} />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef(({ className, src: providedSrc, ...props }, ref) => {
    const [imgSrc, setImgSrc] = React.useState(providedSrc);
    const [error, setError] = React.useState(!providedSrc);

    React.useEffect(() => {
        setImgSrc(providedSrc);
        setError(!providedSrc);
    }, [providedSrc]);

    if (error) {
        return null;
    }

    return (
        <AvatarPrimitive.Image
            ref={ref}
            className={cn("aspect-square h-full w-full object-cover", className)}
            src={imgSrc}
            onError={() => setError(true)}
            {...props}
        />
    )
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props} />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }