import { useState } from "react";

const tabs = [
  {
    id: "services",
    label: "Services",
    items: [
      { number: "01", title: "Adventure & Activities" },
      { number: "02", title: "Hotel & Accommodation" },
      { number: "03", title: "Transportation" },
      { number: "04", title: "Travel Insurance" },
    ],
  },
  {
    id: "trip",
    label: "Trip",
    items: [
      { number: "01", title: "Group Tours" },
      { number: "02", title: "Private Tours" },
      { number: "03", title: "Solo Adventures" },
      { number: "04", title: "Family Packages" },
    ],
  },
  {
    id: "support",
    label: "Support",
    items: [
      { number: "01", title: "24/7 Customer Service" },
      { number: "02", title: "Travel Assistance" },
      { number: "03", title: "Emergency Support" },
      { number: "04", title: "Local Guides" },
    ],
  },
];

export function ServicesSection() {
  const [activeTab, setActiveTab] = useState("services");

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Content */}
          <div>
            <span className="heading-spaced text-primary-foreground/70 mb-6 block">
              Our Services
            </span>
            <h2 className="font-heading text-display-md text-primary-foreground mb-8">
              What We Offer
            </h2>
            <p className="text-body-lg text-primary-foreground/80 mb-10">
              From planning to execution, we handle every detail of your journey 
              so you can focus on making memories.
            </p>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-full text-body-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-cream text-primary"
                      : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Content - Service List */}
          <div className="space-y-0">
            {currentTab?.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-6 py-6 border-b border-primary-foreground/20 group cursor-pointer hover:pl-4 transition-all"
              >
                <span className="text-body-sm text-primary-foreground/50 font-medium">
                  {item.number}
                </span>
                <h3 className="font-heading text-heading-lg text-primary-foreground group-hover:text-cream transition-colors">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}