"use client";

import { trackEvent } from "@/lib/gtag";

interface EventCTALinkProps {
  href: string;
  eventName: string;
  category: string;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}

/** Wraps a registration / organizer CTA link with GA4 event_registration_click tracking. */
export function EventCTALink({ href, eventName, category, style, className, children }: EventCTALinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      className={className}
      onClick={() =>
        trackEvent("event_registration_click", {
          event_name: eventName,
          category,
          destination: href.includes("facebook") ? "facebook" : "organizer_site",
        })
      }
    >
      {children}
    </a>
  );
}
