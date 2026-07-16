"use client";

import {
  DTMFKeypad,
  type DTMFKeypadMode,
} from "@/components/elements/DTMFKeypad";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PhoneIcon } from "lucide-react";

/**
 * Header control that reveals the DTMF keypad on demand.
 *
 * Uses a popover anchored to the phone icon on desktop (sm+) and a bottom
 * drawer on mobile, so the keypad stays out of the way until the user needs
 * to send tones. Rendering both and toggling visibility with Tailwind's `sm:`
 * breakpoint mirrors how the Console switches between its desktop and mobile
 * layouts.
 */
export const KeypadToggle = ({
  mode = "buffered",
}: {
  /** How the keypad dispatches presses. Default: "buffered" */
  mode?: DTMFKeypadMode;
}) => {
  const trigger = (
    <Button variant="ghost" isIcon aria-label="Open keypad">
      <PhoneIcon />
    </Button>
  );

  return (
    <>
      {/* Desktop: popover anchored to the header icon */}
      <div className="hidden sm:block">
        <Popover>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent align="end" side="bottom" className="w-auto">
            <DTMFKeypad mode={mode} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: bottom drawer */}
      <div className="sm:hidden">
        <Drawer>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Keypad</DrawerTitle>
              <DrawerDescription className="sr-only">
                Send DTMF tones to the connected bot.
              </DrawerDescription>
            </DrawerHeader>
            <div className="mx-auto w-full max-w-xs p-4 pt-0">
              <DTMFKeypad mode={mode} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};

export default KeypadToggle;
