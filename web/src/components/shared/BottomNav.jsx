import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon';

const TABS = {
  guard: [
    { to: '/guard', label: 'Home', icon: 'home', end: true },
    { to: '/guard/exit', label: 'Exit', icon: 'exit' },
    { to: '/guard/delivery', label: 'Delivery', icon: 'package' },
    { to: '/guard/residents', label: 'Residents', icon: 'user' },
  ],
  resident: [
    { to: '/resident', label: 'Home', icon: 'home', end: true },
    { to: '/resident/invite', label: 'Invite', icon: 'mail' },
    { to: '/resident/family', label: 'Family', icon: 'users' },
    { to: '/resident/settings', label: 'Settings', icon: 'settings' },
  ],
};

export default function BottomNav({ variant }) {
  const tabs = TABS[variant] || [];
  return (
    <nav style={styles.nav}>
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          style={({ isActive }) => ({ ...styles.tab, color: isActive ? '#4F8EF7' : 'var(--color-text-secondary)' })}
        >
          <Icon name={t.icon} size={22} />
          <span style={{ fontSize: 11, fontWeight: 500 }}>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 480,
    height: 'var(--bottom-nav-height)',
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    zIndex: 50,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    textDecoration: 'none',
    transition: 'color 150ms ease',
  },
};
