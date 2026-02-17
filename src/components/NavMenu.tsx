import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface NavMenuProps {
  currentPath?: string;
}

export default function NavMenu({ currentPath }: NavMenuProps) {
  const navItems = [
    {
      href: ROUTES.CHAT,
      icon: '💬',
      label: 'Chat',
      description: 'AI companion',
    },
    {
      href: ROUTES.GARDEN,
      icon: '🌱',
      label: 'My Garden',
      description: 'Track plants',
    },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link group ${
            currentPath === item.href ? 'bg-white/15' : ''
          }`}
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">
            {item.icon}
          </span>
          <div className="flex-1">
            <span className="font-semibold block">{item.label}</span>
            <span className="text-xs text-white/70">{item.description}</span>
          </div>
        </Link>
      ))}
    </nav>
  );
}
