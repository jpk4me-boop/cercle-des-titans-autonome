import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWPPosts, useWPCategories, stripHtml, getFeaturedImage, getCategories } from "@/hooks/useWordPress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, ArrowRight, ChevronLeft, ChevronRight, BookOpen, Filter } from "lucide-react";

const POSTS_PER_PAGE = 6;

const Blog = () => {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);

  const { data: posts, isLoading: postsLoading, error: postsError } = useWPPosts({
    page: currentPage,
    perPage: POSTS_PER_PAGE,
    category: selectedCategory,
  });

  const { data: categories, isLoading: categoriesLoading } = useWPCategories();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCategoryClick = (categoryId: number | undefined) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  return (
    <>
      <Helmet>
        <title>{language === 'fr' ? 'Blog - Cercle des Titans' : 'Blog - Circle of Titans'}</title>
        <meta 
          name="description" 
          content={language === 'fr' 
            ? 'Découvrez nos articles sur la tontine, l\'épargne collective et la réussite financière.' 
            : 'Discover our articles on tontine, collective savings and financial success.'
          } 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-earth/20 to-background">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
              <BookOpen className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold uppercase tracking-wider">Blog</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
              {language === 'fr' ? 'Notre Blog' : 'Our Blog'}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {language === 'fr' 
                ? 'Conseils, actualités et insights sur l\'épargne collective et la réussite financière.'
                : 'Tips, news and insights on collective savings and financial success.'
              }
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 px-6 border-b border-border">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {language === 'fr' ? 'Filtrer par :' : 'Filter by:'}
                </span>
              </div>
              <Button
                variant={selectedCategory === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(undefined)}
              >
                {language === 'fr' ? 'Tous' : 'All'}
              </Button>
              {categoriesLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                categories?.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {category.name} ({category.count})
                  </Button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-16 px-6">
          <div className="container mx-auto">
            {postsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : postsError ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg mb-4">
                  {language === 'fr' 
                    ? 'Impossible de charger les articles. Veuillez réessayer plus tard.'
                    : 'Unable to load articles. Please try again later.'
                  }
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  {language === 'fr' ? 'Réessayer' : 'Retry'}
                </Button>
              </div>
            ) : posts && posts.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post) => {
                    const featuredImage = getFeaturedImage(post);
                    const postCategories = getCategories(post);
                    
                    return (
                      <Card 
                        key={post.id} 
                        className="group overflow-hidden border-border bg-card hover:border-gold/40 hover:shadow-xl transition-all duration-300"
                      >
                        {featuredImage && (
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={featuredImage} 
                              alt={stripHtml(post.title.rendered)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {postCategories.slice(0, 2).map((cat) => (
                              <Badge key={cat.id} variant="secondary" className="text-xs">
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                          <CardTitle className="font-display text-xl line-clamp-2 group-hover:text-gold transition-colors">
                            {stripHtml(post.title.rendered)}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.date)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                            {stripHtml(post.excerpt.rendered)}
                          </p>
                          <Link 
                            to={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-medium text-sm transition-colors"
                          >
                            {language === 'fr' ? 'Lire la suite' : 'Read more'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-4 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {language === 'fr' ? 'Précédent' : 'Previous'}
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    {language === 'fr' ? `Page ${currentPage}` : `Page ${currentPage}`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!posts || posts.length < POSTS_PER_PAGE}
                    className="gap-2"
                  >
                    {language === 'fr' ? 'Suivant' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  {language === 'fr' 
                    ? 'Aucun article disponible pour le moment.'
                    : 'No articles available at the moment.'
                  }
                </p>
                {selectedCategory && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => handleCategoryClick(undefined)}
                  >
                    {language === 'fr' ? 'Voir tous les articles' : 'View all articles'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Blog;
