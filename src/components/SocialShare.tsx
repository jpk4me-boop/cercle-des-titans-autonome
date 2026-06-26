import { Facebook, Twitter, MessageCircle, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent } from "@/lib/analyticsTracker";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
}

const SocialShare = ({ url, title, description }: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: language === 'fr' ? 'Lien copié !' : 'Link copied!',
        description: language === 'fr' ? 'Le lien a été copié dans le presse-papier.' : 'The link has been copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: language === 'fr' ? 'Impossible de copier le lien.' : 'Unable to copy the link.',
        variant: 'destructive',
      });
    }
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">
        {language === 'fr' ? 'Partager :' : 'Share:'}
      </span>
      
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full border-border hover:border-[#1877F2] hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition-colors"
        onClick={() => openShareWindow(shareLinks.facebook)}
        aria-label="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full border-border hover:border-[#1DA1F2] hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] transition-colors"
        onClick={() => openShareWindow(shareLinks.twitter)}
        aria-label="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full border-border hover:border-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors"
        onClick={() => {
          void trackEvent("click", { label: "whatsapp_public_share" });
          openShareWindow(shareLinks.whatsapp);
        }}
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full border-border hover:border-gold hover:bg-gold/10 hover:text-gold transition-colors"
        onClick={handleCopyLink}
        aria-label="Copy link"
      >
        {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
      </Button>
    </div>
  );
};

export default SocialShare;
