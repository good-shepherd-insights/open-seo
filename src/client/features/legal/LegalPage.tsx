import { BrandIcon } from "@/client/components/BrandIdentity";
import { Markdown } from "@/client/components/Markdown";

export function LegalPage({ title, text }: { title: string; text: string }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <span className="flex size-9 items-center justify-center rounded-[9px] bg-white">
        <BrandIcon className="size-7 object-contain" />
      </span>
      <h1 className="mt-8 mb-6 text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      <Markdown>{text}</Markdown>
    </main>
  );
}
