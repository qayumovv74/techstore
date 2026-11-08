"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "@/lib/cn";

/* Выпадающее меню в духе shadcn/dropdown-menu, но на Base UI Menu */

const DropdownMenu = Menu.Root;

function DropdownMenuTrigger({ className, ...props }: React.ComponentProps<typeof Menu.Trigger>) {
  return <Menu.Trigger className={className} {...props} />;
}

function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 6,
  children,
}: {
  className?: string;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  children: React.ReactNode;
}) {
  return (
    <Menu.Portal>
      <Menu.Positioner align={align} sideOffset={sideOffset} className="z-[70]">
        <Menu.Popup
          className={cn(
            "min-w-36 origin-[var(--transform-origin)] rounded-2xl border border-white/10 bg-surface/95 p-1 text-sm shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl outline-none",
            "transition-[opacity,transform] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className,
          )}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof Menu.Item>) {
  return (
    <Menu.Item
      className={cn(
        "flex cursor-default items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium outline-none select-none data-[highlighted]:bg-violet/20 [&_svg]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Menu.Separator className={cn("-mx-1 my-1 h-px bg-white/10", className)} />;
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator };
