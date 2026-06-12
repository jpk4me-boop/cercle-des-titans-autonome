import { Link, useParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWPPost, stripHtml, getFeaturedImage, getCategories } from "@/hooks/useWordPress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SocialShare from "@/components/SocialShare";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, ArrowLeft, User } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { language } = useLanguage();
  const { data: post, isLoading, error } = useWPPost(slug || '');

  // Get full URL for sharing
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin + location.pathname;
    }
    return '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-40 text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">
            {language === 'fr' ? 'Article non trouvé' : 'Article not found'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {language === 'fr' 
              ? 'L\'article que vous recherchez n\'existe pas ou a été supprimé.'
              : 'The article you are looking for does not exist or has been removed.'
            }
          </p>
          <Link to="/blog">
            <Button variant="default" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {language === 'fr' ? 'Retour au blog' : 'Back to blog'}
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const featuredImage = getFeaturedImage(post);
  const categories = getCategories(post);
  const author = post._embedded?.author?.[0];

  return (
    <>
      <Helmet>
        <title>{stripHtml(post.title.rendered)} - Cercle des Titans</title>
        <meta name="description" content={stripHtml(post.excerpt.rendered).slice(0, 160)} />
        {featuredImage && <meta property="og:image" content={featuredImage} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <article className="pt-32 pb-16">
          {/* Header */}
          <header className="container mx-auto px-6 mb-12">
            <Link 
              to="/blog" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'fr' ? 'Retour au blog' : 'Back to blog'}
            </Link>

            <div className="max-w-3xl mx-auto text-center">
              {categories.length > 0 && (
                <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
                  {categories.map((cat) => (
                    <Badge key={cat.id} variant="secondary">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              )}

              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-6">
                {stripHtml(post.title.rendered)}
              </h1>

              <div className="flex items-center justify-center gap-6 text-muted-foreground text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.date)}
                </span>
                {author && (
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {author.name}
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {featuredImage && (
            <div className="container mx-auto px-6 mb-12">
              <div className="max-w-4xl mx-auto">
                <img 
                  src={featuredImage} 
                  alt={stripHtml(post.title.rendered)}
                  className="w-full rounded-2xl shadow-xl"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="container mx-auto px-6">
            <div 
              className="max-w-3xl mx-auto prose prose-lg prose-invert prose-gold"
              dangerouslySetInnerHTML={{ __html: post.content.rendered }}
            />

            {/* Social Share */}
            <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-border">
              <SocialShare 
                url={getShareUrl()} 
                title={stripHtml(post.title.rendered)}
                description={stripHtml(post.excerpt.rendered).slice(0, 160)}
              />
            </div>
          </div>

          {/* Back to Blog CTA */}
          <div className="container mx-auto px-6 mt-16">
            <div className="max-w-3xl mx-auto text-center border-t border-border pt-12">
              <Link to="/blog">
                <Button variant="outline" size="lg" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {language === 'fr' ? 'Voir tous les articles' : 'View all articles'}
                </Button>
              </Link>
            </div>
          </div>
        </article>

        <Footer />
      </div>
    </>
  );
};

export default BlogPost;
