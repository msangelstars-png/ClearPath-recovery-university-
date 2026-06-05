import { fileDownloadUrl } from "@/services/api";

export default function UserAvatar({ user, size = "md", testId = "user-avatar" }) {
  const sizes = { sm: "h-9 w-9 text-sm", md: "h-12 w-12 text-base", lg: "h-20 w-20 text-2xl", xl: "h-28 w-28 text-4xl" };
  const url = user?.avatar_url?.startsWith("/api/files/") ? fileDownloadUrl(user.avatar_url.split("/api/files/")[1].split("/download")[0]) : user?.avatar_url;
  return (
    <div className={`${sizes[size] || sizes.md} shrink-0 overflow-hidden rounded-full border border-brand-border bg-brand-primary text-white`} data-testid={testId}>
      {url ? <img src={url} alt={user?.display_name || user?.name || "Profile avatar"} className="h-full w-full object-cover" data-testid={`${testId}-image`} /> : <span className="flex h-full w-full items-center justify-center font-heading font-semibold" data-testid={`${testId}-initials`}>{user?.initials || "CP"}</span>}
    </div>
  );
}