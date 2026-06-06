'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Split-pane messages page is now at /messages.
 * Direct deep links redirect there so the user sees the full
 * conversation list + chat side-by-side.
 */
export default function ChatRedirect() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/messages`);
  }, [router]);

  return null;
}
