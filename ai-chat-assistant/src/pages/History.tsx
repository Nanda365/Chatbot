import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Search, MessageSquare, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

export default function History() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [conversationToDeleteId, setConversationToDeleteId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const { data } = await api.getChatHistory();
    setLoading(false);
    
    if (data?.conversations) {
      setConversations(data.conversations);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadHistory();
      return;
    }
    
    const { data } = await api.searchConversations(searchQuery);
    if (data?.conversations) {
      setConversations(data.conversations);
    }
  };

  const groupConversationsByDate = () => {
    const now = new Date();
    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Older: [],
    };

    conversations.forEach((conv) => {
      const date = conv.timestamp && !isNaN(new Date(conv.timestamp).getTime()) ? new Date(conv.timestamp) : new Date();
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        groups.Today.push(conv);
      } else if (daysDiff === 1) {
        groups.Yesterday.push(conv);
      } else if (daysDiff <= 7) {
        groups['This Week'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversationToDeleteId(conversationId);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDeleteId) return;

    setLoading(true);
    const { error } = await api.deleteConversation(conversationToDeleteId);
    setLoading(false);
    setIsConfirmDialogOpen(false); // Close dialog

    if (!error) {
      setConversations(prevConversations => prevConversations.filter(conv => conv.id !== conversationToDeleteId));
      toast({
        title: "Conversation Deleted",
        description: "The conversation has been successfully removed.",
      });
    } else {
      console.error('Failed to delete conversation:', error);
      toast({
        title: "Deletion Failed",
        description: `Failed to delete conversation: ${error}`,
        variant: "destructive",
      });
    }
    setConversationToDeleteId(null); // Reset ID
  };
  
  const groupedConversations = groupConversationsByDate();

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Chat History</h1>
            <p className="text-muted-foreground">Browse and search your previous conversations</p>
          </div>

          <div className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>

          {loading && conversations.length === 0 ? ( // Only show full screen loader if no conversations yet
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 && searchQuery ? (
             <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No conversations found matching "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          ) : conversations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No chat history yet
                </p>
                <Button className="mt-4" onClick={() => navigate('/')}>
                  Start a conversation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedConversations).map(([group, convs]) =>
                convs.length > 0 ? (
                  <div key={group}>
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {group}
                    </h2>
                    <div className="space-y-3">
                      {convs.map((conv) => (
                        <Card
                          key={conv.id || `temp-key-${Math.random()}`} // Fallback for key
                          className="hover:shadow-medium transition-shadow"
                          // Only navigate if not interacting with delete button
                          onClick={(e) => {
                            if (!e.defaultPrevented) { // Check if default was prevented by a child click handler
                              navigate(`/chat/${conv.id}`);
                            }
                          }}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 cursor-pointer" onClick={() => navigate(`/chat/${conv.id}`)}>
                                <CardTitle className="text-lg">{conv.title}</CardTitle>
                                <CardDescription className="mt-1">
                                  {conv.lastMessage}
                                </CardDescription>
                              </div>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault(); // Prevent card onClick from firing
                                    e.stopPropagation(); // Stop event bubbling to parent elements
                                    handleDeleteConversation(conv.id);
                                  }}
                                  className="flex-shrink-0 ml-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{conv.messageCount} messages</span>
                              <span>•</span>
                              <span>{formatDistance(conv.timestamp && !isNaN(new Date(conv.timestamp).getTime()) ? new Date(conv.timestamp) : new Date(), new Date(), { addSuffix: true })}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your conversation
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConversationToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
