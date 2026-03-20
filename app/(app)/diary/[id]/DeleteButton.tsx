"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

export default function DeleteButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    const res = await fetch(`/api/diary/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Entry deleted");
      router.push("/diary");
    } else {
      toast("Failed to delete", "error");
    }
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg text-sm bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors"
      >
        Delete
      </button>
      <ConfirmDialog
        open={open}
        title="Delete entry?"
        message="This will permanently remove this diary entry."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
