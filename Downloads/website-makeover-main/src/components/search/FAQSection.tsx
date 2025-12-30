import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I book a tour with Explo?",
    answer: "Booking is simple! Browse our tour packages, select your preferred dates, and complete the booking form. Our team will confirm your reservation within 24 hours.",
  },
  {
    question: "What's included in the tour packages?",
    answer: "Our packages typically include accommodation, transportation, guided tours, and select meals. Each package page details exactly what's included and what's optional.",
  },
  {
    question: "Can I customize my tour itinerary?",
    answer: "Absolutely! We offer customization options for most tours. Contact our team to discuss your preferences and we'll create a personalized experience just for you.",
  },
  {
    question: "What is your cancellation policy?",
    answer: "We offer free cancellation up to 30 days before departure. Cancellations within 30 days may incur fees depending on the tour. Full details are provided at booking.",
  },
  {
    question: "Do you offer group discounts?",
    answer: "Yes! Groups of 6 or more receive a 10% discount, and groups of 12+ receive 15% off. Contact us for custom group pricing on larger bookings.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24 bg-muted">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="heading-spaced text-primary mb-4 block">
              FAQ
            </span>
            <h2 className="font-heading text-display-md text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-body-lg text-muted-foreground">
              Find answers to common questions about our tours and services.
            </p>
          </div>

          {/* Accordion */}
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-2xl px-6 border-none shadow-soft"
              >
                <AccordionTrigger className="text-left font-heading text-heading-sm hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-body-md text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}