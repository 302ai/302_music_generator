"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chatVisibleAtom } from "@/stores/slices/chat_store";
import { isOutsideDeployMode } from "@/utils/302";
import { isAuthPath } from "@/utils/path";
import { useAtom } from "jotai";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { ToolInfo } from "./tool-info";

type HeaderProps = {
  className?: string;
};

const Header = forwardRef<HTMLDivElement, HeaderProps>(({ className }, ref) => {
  const pathname = usePathname();
  const [isChatVisible, setIsChatVisible] = useAtom(chatVisibleAtom);

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
    if (isChatVisible) {
      document.getElementById("ss-chat-p")?.remove();
    }
  };

  return (
    <header
      className={cn(
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div
        ref={ref}
        className={cn(
          "fixed right-0 top-0 z-50 flex items-center justify-end gap-2 p-2",
          className
        )}
      >
        {!isAuthPath(pathname) && !isOutsideDeployMode() && <ToolInfo />}
        <Button
          variant="icon"
          size="roundIconSm"
          onClick={toggleChat}
          className={cn(isChatVisible && "text-primary")}
        >
          <MessageCircle className="size-4" />
        </Button>
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
});

Header.displayName = "AppHeader";

export default Header;
