import { Message } from "@/types/concierge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserMessageProps {
  message: Message;
}

export const UserMessage = ({ message }: UserMessageProps) => (
  <div className="message-user mb-4">
    <div className="flex items-start gap-3 justify-end">
      <div className="max-w-[80%]">
        <div className="bg-primary text-primary-foreground rounded-lg p-4">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
      <Avatar className="w-8 h-8">
        <AvatarFallback className="text-sm bg-primary text-primary-foreground">
          👤
        </AvatarFallback>
      </Avatar>
    </div>
  </div>
);