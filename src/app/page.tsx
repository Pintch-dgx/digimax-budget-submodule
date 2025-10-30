import { SummaryCard } from "@/components/SummaryCard";
import { getDashboardData } from "@/lib/dashboard-service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 100000 ? 0 : 2,
  }).format(value);
}

export default async function Home() {
  const { summaryMetrics, campaignAllocations, upcomingApprovals, insights } = await getDashboardData();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Marketing Budget Hub</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Controllo end-to-end del budget marketing Digimax: visibilità, governance, insight.
            </p>
          </div>
          <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            + Nuova Richiesta Budget
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Stato budget FY24
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaryMetrics.map((metric) => (
              <SummaryCard key={metric.label} metric={metric} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Allocazione campagne</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Allinea la spesa con le priorità strategiche.
                </p>
              </div>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Esporta
              </button>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Campagna</th>
                    <th className="py-2 pr-4">Canale</th>
                    <th className="py-2 pr-4">Owner</th>
                    <th className="py-2 pr-4 text-right">Allocato</th>
                    <th className="py-2 pr-4 text-right">Speso</th>
                    <th className="py-2 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {campaignAllocations.map((campaign) => {
                    const delta = campaign.allocated - campaign.spent;
                    const deltaColor =
                      delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-slate-500";
                    return (
                      <tr key={campaign.name}>
                        <td className="py-3 pr-4 font-medium">{campaign.name}</td>
                        <td className="py-3 pr-4">{campaign.channel}</td>
                        <td className="py-3 pr-4">{campaign.owner}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(campaign.allocated)}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(campaign.spent)}</td>
                        <td className={`py-3 text-right tabular-nums ${deltaColor}`}>{formatCurrency(delta)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <header className="mb-4">
                <h2 className="text-lg font-semibold">Approvazioni in arrivo</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sblocca i budget critici prima delle deadline.
                </p>
              </header>
              <ul className="space-y-4 text-sm">
                {upcomingApprovals.map((approval) => (
                  <li key={approval.title} className="space-y-1 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <p className="font-medium">{approval.title}</p>
                    <p className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Richiedente: {approval.requester}</span>
                      <span>{formatCurrency(approval.amount)}</span>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Scadenza{" "}
                      {new Date(approval.dueDate).toLocaleDateString("it-IT", { month: "short", day: "numeric" })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <header className="mb-4">
                <h2 className="text-lg font-semibold">Insight operativi</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Suggerimenti generati dai dati per ottimizzare il budget.
                </p>
              </header>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {insights.map((insight) => (
                  <li key={insight.title}>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{insight.title}</p>
                    <p>{insight.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
