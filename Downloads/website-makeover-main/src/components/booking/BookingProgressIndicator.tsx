import { Check, Hotel, Users, CreditCard, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingProgressIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

const steps = [
  { id: 1, name: "Select Room", icon: Hotel },
  { id: 2, name: "Guest Details", icon: Users },
  { id: 3, name: "Payment", icon: CreditCard },
  { id: 4, name: "Confirmation", icon: CheckCircle },
];

export function BookingProgressIndicator({ currentStep }: BookingProgressIndicatorProps) {
  return (
    <div className="w-full py-4">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-center gap-2 md:gap-4">
          {steps.map((step, stepIdx) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isUpcoming = step.id > currentStep;
            const Icon = step.icon;

            return (
              <li key={step.name} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "border-primary bg-primary/10 text-primary",
                      isUpcoming && "border-muted-foreground/30 bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium hidden md:block",
                      isCompleted && "text-primary",
                      isCurrent && "text-primary font-semibold",
                      isUpcoming && "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                
                {/* Connector line */}
                {stepIdx < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-8 md:w-16 mx-2",
                      step.id < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
