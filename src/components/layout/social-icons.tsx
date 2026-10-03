import { MessageCircle, Send, SquarePlay } from "lucide-react";
import type { ReactNode } from "react";
import type { SocialKey } from "@/content/site";

export const socialIcons: Record<SocialKey, ReactNode> = {
  telegram: <Send size={16} />,
  whatsapp: <MessageCircle size={16} />,
  vk: <span className="text-[11px] font-bold leading-none">VK</span>,
  youtube: <SquarePlay size={16} />,
};
