import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  status?: 'sending' | 'delivered' | 'error';
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const { data, error } = await api.sendMessage(content, conversationId);

    if (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
        )
      );
      setIsTyping(false);
      toast({
        title: 'Failed to send message',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    // Update user message status
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === userMessage.id ? { ...msg, status: 'delivered' } : msg
      )
    );

    if (data?.response) {
      const assistantMessage: Message = {
        id: data.messageId,
        content: data.response,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
    }
    setIsTyping(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-gradient-primary mx-auto mb-6 flex items-center justify-center shadow-glow">
                <span className="text-4xl">💬</span>
              </div>
              <h2 className="text-2xl font-semibold mb-3">Start a Conversation</h2>
              <p className="text-muted-foreground mb-6">
                Ask me anything! I'm here to help with your questions based on our knowledge base.
              </p>
              <div className="grid gap-2 text-sm">
                <Button variant="outline" className="justify-start" onClick={() => handleSend("How can you help me?")}>
                  How can you help me?
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleSend("What information do you have access to?")}>
                  What information do you have access to?
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleSend("Tell me about your capabilities")}>
                  Tell me about your capabilities
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 space-y-4">
              {conversationId && (
                <div className="flex justify-end mb-4">
                  <Button variant="outline" size="sm" onClick={handleNewChat}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                </div>
              )}
              
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  role={message.role}
                  timestamp={message.timestamp}
                  status={message.status}
                />
              ))}
              
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          disabled={isTyping}
          placeholder="Type your message..."
        />
      </div>
    </div>
  );
}
