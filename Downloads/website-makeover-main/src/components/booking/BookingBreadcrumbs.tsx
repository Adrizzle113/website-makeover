import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BookingBreadcrumbsProps {
  hotelName: string;
  hotelId: string;
}

export function BookingBreadcrumbs({ hotelName, hotelId }: BookingBreadcrumbsProps) {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Search", href: "/" },
    { label: hotelName, href: `/hoteldetails/${hotelId}` },
    { label: "Booking" },
  ];

  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex items-center gap-1.5 text-sm flex-wrap">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/50" />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors truncate max-w-[150px]"
              >
                {index === 0 ? (
                  <Home className="h-4 w-4" />
                ) : (
                  item.label
                )}
              </Link>
            ) : (
              <span className="text-primary-foreground font-medium truncate max-w-[150px]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
