import { cn } from "@/utils/utils";
import type { MemberDto } from "@/lib/garden/types";

export function MemberAvatar({
  member,
  size = 20,
  className,
}: {
  member?: Pick<MemberDto, "displayName" | "avatarUrl" | "avatarColor"> | null;
  size?: number;
  className?: string;
}) {
  const initial = member?.displayName?.trim().slice(0, 1) ?? "?";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-[0.6rem] leading-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: member?.avatarUrl ? "transparent" : (member?.avatarColor ?? "#697e65"),
        color: "#f7f5ee",
      }}
      aria-hidden="true"
    >
      {member?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
