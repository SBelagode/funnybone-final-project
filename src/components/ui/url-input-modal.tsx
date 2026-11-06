import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UrlInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  currentUrl: string;
  setCurrentUrl: (url: string) => void;
}

export function UrlInputModal({
  isOpen,
  onClose,
  onSubmit,
  currentUrl,
  setCurrentUrl,
}: UrlInputModalProps) {
  const handleSubmit = () => {
    onSubmit(currentUrl);
    onClose(); // Close the modal after submitting
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-md sm:text-lg md:text-xl">
            Enter Image URL
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <Input
            type="url"
            placeholder="https://www.example.com/image.jpg"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            className={[
              "flex-1 h-[44px] sm:h-[48px] md:h-[52px]",
              "border-2 border-primary rounded-xl bg-transparent",
              "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary",
              "text-sm sm:text-base md:text-lg",
            ].join(" ")}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className={[
                "border border-primary text-primary hover:bg-primary/10",
                "h-[36px] sm:h-[40px] md:h-[44px] text-sm sm:text-base md:text-lg",
              ].join(" ")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!currentUrl.trim()}
              className={[
                "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
                "h-[36px] sm:h-[40px] md:h-[44px] text-sm sm:text-base md:text-lg",
              ].join(" ")}
            >
              Crack
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
