'use client';

import { AppProvider } from '@/context/context';

export default function Providers({ children }) {
    return <AppProvider>{children}</AppProvider>;
}
