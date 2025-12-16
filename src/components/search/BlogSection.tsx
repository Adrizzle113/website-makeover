import { Clock, ArrowRight } from "lucide-react";

const articles = [
  {
    title: "10 Hidden Gems in Southeast Asia You Need to Visit",
    excerpt: "Discover off-the-beaten-path destinations that will take your breath away.",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=600&q=80",
    readTime: "5 min read",
  },
  {
    title: "The Ultimate Guide to Sustainable Travel",
    excerpt: "How to explore the world while minimizing your environmental impact.",
    image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=600&q=80",
    readTime: "8 min read",
  },
  {
    title: "Adventure Sports: Where to Find the Best Thrills",
    excerpt: "From bungee jumping to white water rafting, here are the top spots.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80",
    readTime: "6 min read",
  },
];

export function BlogSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="heading-spaced text-primary mb-4 block">
              Our Blog
            </span>
            <h2 className="font-heading text-display-md text-foreground">
              Travel Stories & Tips
            </h2>
          </div>
          <a
            href="/blog"
            className="text-body-md font-medium text-primary hover:underline flex items-center gap-2"
          >
            View All Articles
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Article Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <article
              key={index}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <span className="badge-pill bg-white/90 text-foreground text-body-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    {article.readTime}
                  </span>
                </div>
              </div>
              <h3 className="font-heading text-heading-md text-foreground mb-3 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              <p className="text-body-md text-muted-foreground">
                {article.excerpt}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}