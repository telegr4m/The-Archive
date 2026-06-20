"use client";

import Image from "next/image";
import { useState } from "react";

const PROFILE_IMAGE_PATH = "/images/profile/telegram-profile.jpg";

export default function TelegramProfileImage() {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-red-400/20 bg-gradient-to-br from-red-950/35 via-neutral-950 to-black">
      {hasError ? (
        <div
          className="flex h-full items-center justify-center text-3xl font-semibold lowercase text-red-900"
          aria-label="telegram profile image unavailable"
          role="img"
        >
          t
        </div>
      ) : (
        <Image
          fill
          priority
          src={PROFILE_IMAGE_PATH}
          alt="telegram profile"
          sizes="(min-width: 640px) 160px, 120px"
          className="object-cover object-center"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
