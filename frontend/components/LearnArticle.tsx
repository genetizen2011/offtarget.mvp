import Link from "next/link";
import type { LearnPage } from "@/lib/learnContent";

type LearnArticleProps = {
  page: LearnPage;
};

export default function LearnArticle({ page }: LearnArticleProps) {
  const sectionLinks = page.topics.flatMap((topic) =>
    topic.sections.map((section) => ({
      id: `${topic.title}-${section.heading}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      label: section.heading,
    })),
  );

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-panel">
            <Link
              href="/learn"
              className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            >
              Back to Learn
            </Link>
            <div className="mt-5 border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Sections
              </p>
              <nav className="mt-3 space-y-2">
                {sectionLinks.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-xl px-3 py-2 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        <article className="space-y-6">
          <header className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
              Learning library
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
              {page.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600">
              {page.description}
            </p>
          </header>

          {page.topics.map((topic) => (
            <section
              key={topic.title}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-panel"
            >
              <div className="border-b border-gray-100 pb-5">
                <h2 className="text-2xl font-semibold text-gray-950">
                  {topic.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {topic.summary}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {topic.sections.map((section) => {
                  const id = `${topic.title}-${section.heading}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
                  return (
                    <details
                      key={section.heading}
                      id={id}
                      className="group rounded-2xl border border-gray-200 bg-gray-50 p-4 open:bg-white"
                      open
                    >
                      <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700 group-open:bg-blue-600 group-open:text-white">
                          +
                        </span>
                        {section.heading}
                      </summary>
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {section.content}
                      </p>
                    </details>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <h3 className="text-sm font-semibold text-emerald-900">
                    Key points
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-800">
                    {topic.key_points.map((point) => (
                      <li key={point}>- {point}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                  <h3 className="text-sm font-semibold text-yellow-900">
                    Limitations
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-yellow-800">
                    {topic.limitations}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  References
                </h3>
                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  {topic.references.map((reference) => (
                    <li key={reference}>{reference}</li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
