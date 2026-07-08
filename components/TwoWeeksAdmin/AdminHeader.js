import { TABS } from "./constants";
import { cx } from "./utils";

function TabButton({ tab, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(tab.id)}
      className={cx(
        "h-11 whitespace-nowrap border px-4 text-sm font-black transition",
        active
          ? "border-zinc-950 bg-zinc-950 text-white"
          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-950 hover:text-zinc-950"
      )}
    >
      {tab.label}
    </button>
  );
}

export default function AdminHeader({ activeTab, onChangeTab }) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-[#f4f1eb]/95 backdrop-blur">
      <div className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-5 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-orange-600">2weeks admin</div>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.065em] text-zinc-950 sm:text-4xl">
              투윅스 운영관리
            </h1>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((tab) => (
              <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={onChangeTab} />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
