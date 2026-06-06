'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Split-pane messages page is now at /messages.
 * Direct deep links redirect with ?user=userId so the
 * conversation list + chat appear side-by-side.
 */
export default function ChatRedirect() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/messages?user=${userId}`);
  }, [router, userId]);

  return null;
}
