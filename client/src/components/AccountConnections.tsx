import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/contexts/LanguageContext";
import type { MemoryRecord } from "@shared/nexo/types";
import { toast } from "sonner";

export default function AccountConnections({
  server,
  notes,
  onRefresh,
  readOnly,
}: {
  server: boolean;
  notes: MemoryRecord[];
  onRefresh: () => Promise<void>;
  readOnly: boolean;
}) {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const status = trpc.auth.connections.useQuery(undefined, {
    enabled: server,
    retry: false,
    staleTime: 30000,
  });
  const account = status.data?.user;
  const [pending, setPending] = useState<MemoryRecord[]>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("nexo.notes.before-login") || "[]"
      );
      return Array.isArray(saved) ? saved.slice(0, 200) : [];
    } catch {
      return [];
    }
  });
  const [importing, setImporting] = useState(false);
  return (
    <section className="integration-card space-y-3">
      <h3 className="technical-label">{t("Account & workspace sync")}</h3>
      {account ? (
        <>
          <p className="text-sm">{account.name || account.email}</p>
          <p className="text-xs leading-relaxed text-cyan-100/60">
            {t(
              "Your notes, timers, and reminders sync through this server. Other signed-in devices refresh every 10 seconds while visible."
            )}
          </p>
          {pending.length > 0 && (
            <div className="space-y-2 border border-cyan-100/20 p-3">
              <p className="text-xs">
                {t(
                  "Notes from before sign-in are available in this browser. Importing adds notes and skips duplicates; timers stay in their original workspace."
                )}
              </p>
              <button
                className="integration-button"
                disabled={readOnly || importing}
                onClick={() => {
                  setImporting(true);
                  void utils.client.nexo2.workspace.importNotes
                    .mutate({
                      notes: pending.map(n => ({
                        kind: n.kind,
                        content: n.content,
                        importance: n.importance,
                        tags: n.tags,
                      })),
                    })
                    .then(async () => {
                      localStorage.removeItem("nexo.notes.before-login");
                      setPending([]);
                      await onRefresh();
                      toast.success(t("Notes imported"));
                    })
                    .catch(() =>
                      toast.error(
                        t("Import failed. Your saved notes were preserved.")
                      )
                    )
                    .finally(() => setImporting(false));
                }}
              >
                {t("Import notes from this browser")}
              </button>
              <button
                className="integration-button ml-2"
                disabled={importing}
                onClick={() => {
                  localStorage.removeItem("nexo.notes.before-login");
                  setPending([]);
                }}
              >
                {t("Dismiss import")}
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              className="integration-button"
              onClick={() => void onRefresh()}
            >
              {t("Sync now")}
            </button>
            <button
              className="integration-button"
              onClick={() =>
                void utils.client.auth.logout
                  .mutate()
                  .then(() => {
                    sessionStorage.removeItem("manus-cookie");
                    window.location.assign("/");
                  })
                  .catch(() => toast.error(t("Sign-out failed. Try again.")))
              }
            >
              {t("Sign out")}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs leading-relaxed text-cyan-100/60">
            {t(
              "Sign in on your Node server to open the same workspace on multiple devices. Local and guest workspaces stay separate."
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {(["google", "microsoft"] as const).map(id => (
              <button
                key={id}
                className="integration-button"
                disabled={
                  !server ||
                  !status.data?.providers.find(p => p.id === id)?.configured
                }
                onClick={() => {
                  // Leave a portable copy in this browser; sign-in never silently moves or deletes notes.
                  try {
                    localStorage.setItem(
                      "nexo.notes.before-login",
                      JSON.stringify(notes)
                    );
                  } catch {}
                  window.location.assign(`/api/account/${id}/start`);
                }}
              >
                {t("Sign in with {provider}", {
                  provider: id === "google" ? "Google" : "Microsoft",
                })}
              </button>
            ))}
          </div>
          <p className="text-xs text-cyan-100/50">
            {t(
              "Available after OAuth credentials are configured on the server."
            )}
          </p>
        </>
      )}
    </section>
  );
}
