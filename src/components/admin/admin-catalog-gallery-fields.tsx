"use client";

const MAX_GALLERY = 6;

type Props = {
  controlled: boolean;
  onControlledChange: (v: boolean) => void;
  existingUrls: string[];
  onExistingUrlsChange: (urls: string[]) => void;
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
  urlLines: string;
  onUrlLinesChange: (lines: string) => void;
  disabled?: boolean;
  restrictLabel?: string;
  restrictHelp?: string;
};

const inputClass = "input";

export function AdminCatalogGalleryFields({
  controlled,
  onControlledChange,
  existingUrls,
  onExistingUrlsChange,
  newFiles,
  onNewFilesChange,
  urlLines,
  onUrlLinesChange,
  disabled,
  restrictLabel = "Gallery: only this dress's photos",
  restrictHelp = "When checked, the shop gallery uses the hero and extras below—no generic lookbook filler.",
}: Props) {
  const totalCount = existingUrls.length + newFiles.length + urlLines.split("\n").filter((l) => l.trim().startsWith("https://")).length;

  return (
    <div className="min-w-0 space-y-4">
      <label className="flex min-w-0 cursor-pointer items-start gap-2 text-sm text-[var(--lf-ink)]">
        <input
          type="checkbox"
          className="mt-1 accent-[var(--lf-purple-deep)]"
          checked={controlled}
          disabled={disabled}
          onChange={(e) => onControlledChange(e.target.checked)}
        />
        <span className="min-w-0">
          <span className="font-medium">{restrictLabel}</span>
          <span className="mt-0.5 block text-xs font-normal text-[var(--lf-muted)]">{restrictHelp}</span>
        </span>
      </label>

      <div>
        <label className="block text-sm font-medium text-[var(--lf-ink)]">Extra gallery images (max {MAX_GALLERY})</label>
        <p className="mt-0.5 text-xs text-[var(--lf-muted)]">
          Upload new files and/or paste https URLs (one per line). Shown as thumbnails on the product page.
        </p>

        {existingUrls.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {existingUrls.map((url) => (
              <li key={url} className="flex min-w-0 items-start gap-2 text-xs">
                <span className="min-w-0 flex-1 break-all font-mono text-[var(--lf-muted)]">{url}</span>
                <button
                  type="button"
                  disabled={disabled}
                  className="shrink-0 font-semibold text-[var(--lf-purple)] hover:underline disabled:opacity-50"
                  onClick={() => onExistingUrlsChange(existingUrls.filter((u) => u !== url))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)]">
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={disabled || totalCount >= MAX_GALLERY}
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
                const combined = [...newFiles, ...picked].slice(0, MAX_GALLERY - existingUrls.length);
                onNewFilesChange(combined);
                e.target.value = "";
              }}
            />
            Choose files
          </label>
          {newFiles.length > 0 ? (
            <button
              type="button"
              className="text-sm font-semibold text-[var(--lf-purple)] hover:underline"
              onClick={() => onNewFilesChange([])}
            >
              Clear new uploads
            </button>
          ) : null}
        </div>
        {newFiles.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-xs text-[var(--lf-muted)]">
            {newFiles.map((f) => (
              <li key={f.name + f.size}>{f.name}</li>
            ))}
          </ul>
        ) : null}

        <textarea
          className={`${inputClass} mt-3 min-h-[80px] min-w-0 resize-y font-mono text-xs wrap-anywhere`}
          value={urlLines}
          disabled={disabled || !controlled}
          onChange={(e) => onUrlLinesChange(e.target.value)}
          placeholder="https://… (one per line)"
        />
      </div>
    </div>
  );
}

export function mergeGalleryUrls(
  existingUrls: string[],
  uploadedUrls: string[],
  urlLines: string,
): string[] | undefined {
  const fromLines = urlLines
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("https://"));
  const merged = [...existingUrls, ...uploadedUrls, ...fromLines];
  const unique: string[] = [];
  for (const u of merged) {
    if (!unique.includes(u)) unique.push(u);
    if (unique.length >= MAX_GALLERY) break;
  }
  return unique;
}
