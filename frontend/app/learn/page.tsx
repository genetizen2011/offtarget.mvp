import Link from "next/link";
import { learnPages } from "@/lib/learnContent";

export default function LearnIndexPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <header className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-panel">
          <Link
            href="/"
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
          >
            Back to analysis
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            Scientific learning system
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
            CRISPR learning library
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600">
            Concise, reusable reference content for interpreting guide design,
            PAM constraints, off-target risk, and repair outcomes.
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {learnPages.map((page) => (
            <Link
              key={page.slug}
              href={`/learn/${page.slug}`}
              className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                Learn
              </p>
              <h2 className="mt-2 text-xl font-semibold text-gray-950">
                {page.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {page.description}
              </p>
              <span className="mt-5 inline-flex text-sm font-semibold text-blue-700 transition group-hover:text-blue-800">
                Open module
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
