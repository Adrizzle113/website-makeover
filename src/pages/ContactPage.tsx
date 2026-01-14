import { ContactSection } from "@/components/search";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const ContactPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header variant="dark" />
      <main className="flex-1 pt-20">
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;