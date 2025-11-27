import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('');
  const { toast } = useToast();

  const handleAddFaq = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast({
        title: 'Invalid input',
        description: 'Please provide both a question and an answer.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await api.addFaq({
      question: faqQuestion,
      answer: faqAnswer,
      tags: faqCategory ? faqCategory.split(',').map(tag => tag.trim()) : [],
    });

    if (error) {
      toast({
        title: 'Failed to add FAQ',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'FAQ added',
      description: 'The FAQ has been added to the knowledge base.',
    });

    setFaqQuestion('');
    setFaqAnswer('');
    setFaqCategory('');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage FAQs for the AI knowledge base.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add FAQ</CardTitle>
              <CardDescription>
                Create frequently asked questions to improve AI responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="faq-question">Question</Label>
                <Input
                  id="faq-question"
                  placeholder="e.g., What is your return policy?"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faq-answer">Answer</Label>
                <Textarea
                  id="faq-answer"
                  placeholder="e.g., Our return policy allows..."
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faq-category">Tags (comma-separated)</Label>
                <Input
                  id="faq-category"
                  placeholder="e.g., returns, refunds, policy"
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                />
              </div>

              <Button onClick={handleAddFaq} className="w-full">
                Add FAQ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
