import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, ArrowRight } from "lucide-react";

interface GuestComposition {
  adults: number;
  childrenAges: number[];
}

interface GuestCompositionChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalComposition: GuestComposition;
  newComposition: GuestComposition;
  onConfirm: () => void;
  onCancel: () => void;
}

export function GuestCompositionChangeModal({
  open,
  onOpenChange,
  originalComposition,
  newComposition,
  onConfirm,
  onCancel,
}: GuestCompositionChangeModalProps) {
  const formatComposition = (comp: GuestComposition) => {
    const parts: string[] = [];
    parts.push(`${comp.adults} adult${comp.adults !== 1 ? "s" : ""}`);
    if (comp.childrenAges.length > 0) {
      const childrenText = comp.childrenAges.length === 1
        ? `1 child (age ${comp.childrenAges[0]})`
        : `${comp.childrenAges.length} children (ages ${comp.childrenAges.join(", ")})`;
      parts.push(childrenText);
    }
    return parts.join(", ");
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle className="text-xl">Guest Composition Changed</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-4 pt-2">
            <p>
              You've modified the guest composition from your original search.
              Room rates are tied to the guest count and ages.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Original search</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatComposition(originalComposition)}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">New composition</p>
                  <p className="text-sm font-medium text-primary">
                    {formatComposition(newComposition)}
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-sm">
              To proceed with the updated guest count, you'll need to go back to the hotel page 
              and re-select a room with rates matching your new guest composition.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancel Changes
          </Button>
          <Button
            onClick={handleConfirm}
            className="w-full sm:w-auto"
          >
            Go Back to Hotel
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
