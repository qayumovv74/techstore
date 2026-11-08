"use client";

import * as React from "react";
import { ScrollArea as SA } from "@base-ui/react/scroll-area";
import { cn } from "@/lib/cn";

/* Прокручиваемая область с тонким скроллбаром (shadcn/scroll-area на Base UI) */
function ScrollArea({
  className,
  viewportClassName,
  viewportRef,
  children,
  ...props
}: React.ComponentProps<typeof SA.Root> & { viewportClassName?: string; viewportRef?: React.Ref<HTMLDivElement> }) {
  return (
    <SA.Root className={cn("relative overflow-hidden", className)} {...props}>
      <SA.Viewport ref={viewportRef} className={cn("h-full w-full overscroll-contain rounded-[inherit]", viewportClassName)}>
        {children}
      </SA.Viewport>
      <SA.Scrollbar orientation="vertical" className="flex w-2.5 touch-none p-px opacity-0 transition-opacity select-none data-[hovering]:opacity-100 data-[scrolling]:opacity-100">
        <SA.Thumb className="w-full rounded-full bg-white/25" />
      </SA.Scrollbar>
    </SA.Root>
  );
}

export { ScrollArea };
