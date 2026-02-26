'use client';

import { useRouter } from 'next/navigation';

import { logoutAction } from '@/app/actions';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.replace('/'); // go back to login/signup
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-800 hover:border-slate-500 transition"
    >
      Logout
    </button>
  );
}
