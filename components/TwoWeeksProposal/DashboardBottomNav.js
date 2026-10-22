import { FiHome, FiHeart, FiUser } from "react-icons/fi";

const ITEMS = [
  { id: "home", label: "HOME", Icon: FiHome },
  { id: "intro", label: "소개", Icon: FiHeart },
  { id: "my", label: "MY", Icon: FiUser },
];

export default function DashboardBottomNav({ activeSection, onChange }) {
  return (
    <nav aria-label="투윅스 대시보드" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e0e7f2] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(17,41,76,.06)] backdrop-blur">
      <div className="mx-auto grid max-w-[640px] grid-cols-3">
        {ITEMS.map(({ id, label, Icon }) => (
          <button key={id} type="button" aria-current={activeSection === id ? "page" : undefined} onClick={() => onChange(id)}
            className={`group relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold outline-none transition-colors duration-150 active:scale-[.98] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#326bda] ${activeSection === id ? "text-[#2366d0]" : "text-[#7d8ba0] hover:text-[#2366d0]"}`}>
            <Icon size={21} aria-hidden="true"/><span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
