export default function UserAvatar({ user, size = 'md', testId = 'user-avatar' }) {
  const sizes = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-20 w-20 text-2xl',
    xl: 'h-28 w-28 text-4xl',
  };

  const url = user?.avatar_url;
  const emoji = user?.avatar_emoji || '🎓';
  const initial = (user?.display_name || 'U').charAt(0).toUpperCase();

  return (
    <div
      className={`${sizes[size] || sizes.md} shrink-0 overflow-hidden rounded-full border border-brand-border bg-brand-primary text-white`}
      data-testid={testId}
    >
      {url ? (
        <img
          src={url}
          alt={user?.display_name || 'Profile avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {size === 'sm' ? initial : emoji}
        </span>
      )}
    </div>
  );
}
