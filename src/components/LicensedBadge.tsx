export function LicensedBadge({ text }: { text?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-sm">
      <svg className="h-4 w-4 text-navy-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 1.5l7.5 3v5c0 4.5-3.2 8.4-7.5 9.5C5.7 17.9 2.5 14 2.5 9.5v-5L10 1.5zm-.7 11.2 5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3z" clipRule="evenodd" />
      </svg>
      {text ?? "Licensed & Insured"}
    </div>
  );
}
