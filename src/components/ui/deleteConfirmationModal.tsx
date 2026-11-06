import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DeleteButton } from "@/components/ui/delete-button";

interface DeleteConfirmationModalProps {
  onConfirmDelete: () => void;
  itemName?: string;
  description?: string;
  autoOpen?: boolean;
}

export default function DeleteConfirmationModal({
  onConfirmDelete,
  itemName = "this image",
  description,
  autoOpen = false,
}: DeleteConfirmationModalProps) {
  const [open, setOpen] = useState(autoOpen);

  const handleConfirm = () => {
    onConfirmDelete();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {!autoOpen && <DeleteButton onClick={() => setOpen(true)} />}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">Confirm to delete</DialogTitle>
          <DialogDescription>
            {description
              ? description
              : `Are you sure you want to delete ${itemName}? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="hover:bg-[#9c9793]"
            style={{ backgroundColor: "#a49f9b", color: "black" }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/30"
          >
            Delete
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
