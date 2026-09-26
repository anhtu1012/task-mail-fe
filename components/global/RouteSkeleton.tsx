/**
 * Khung chờ dùng cho các `loading.tsx`.
 *
 * Next tải trước (prefetch) loading UI cùng với link, nên bấm chuyển trang là
 * khung này hiện NGAY — thay vì màn hình cũ đứng im tới khi trang mới sẵn
 * sàng, làm người dùng tưởng mình bấm trượt.
 *
 * Server Component thuần (không antd, không hook) để nhẹ và prefetch được.
 * Màu trắng mờ để hợp với nền kính của app ở mọi theme.
 */
type Variant = "board" | "list" | "dashboard" | "calendar";

const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`rounded-lg bg-white/20 animate-pulse ${className}`} />
);

export default function RouteSkeleton({ variant }: { variant: Variant }) {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="flex flex-col gap-3 h-full min-h-0 p-1">
      <Bar className="h-10 w-full max-w-[520px]" />

      {variant === "board" && (
        <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">
          {[5, 3, 4, 2].map((n, i) => (
            <div
              key={i}
              className="w-[min(292px,82vw)] shrink-0 self-start rounded-[14px] bg-white/10 p-2 flex flex-col gap-2"
            >
              <Bar className="h-7 w-2/3" />
              {Array.from({ length: n }, (_, j) => (
                <Bar key={j} className="h-[62px]" />
              ))}
            </div>
          ))}
        </div>
      )}

      {variant === "list" && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Bar key={i} className="h-12" />
          ))}
        </div>
      )}

      {variant === "dashboard" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Bar key={i} className="h-24" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Bar className="h-64" />
            <Bar className="h-64" />
          </div>
        </>
      )}

      {variant === "calendar" && <Bar className="flex-1 min-h-[420px]" />}
    </div>
  );
}
