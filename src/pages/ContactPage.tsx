import { ContactSection } from "@/components/search";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const ContactPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative pt-32 pb-20 px-4 bg-gradient-to-br from-primary via-primary/90 to-accent overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10" />
          <div className="relative z-10 container max-w-4xl text-center">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-primary-foreground mb-4 animate-fade-in">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </section>
        
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;