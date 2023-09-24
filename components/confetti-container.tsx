"use client";

import { useAppStore } from "@/app/zustand";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
export function ConfettiExplosionContainer() {
  const [client, setClient] = useState(false);
  const [isSmallExploding, setIsSmallExploding] = useState(true);
  const { width, height } = useWindowSize();
  const confetti = useAppStore((s) => s.confetti);
  const explode = useAppStore((s) => s.explode);

  useEffect(() => {
    setClient(true);
  }, []);

  useEffect(() => {
    if (confetti) {
      setTimeout(() => {
        explode(false);
      }, 7000);
    }
  }, [confetti]);

  return (
    <>
      {client && confetti && (
        <div className="fixed top-0 w-full h-full z-50 pointer-events-none left-0">
          <Confetti
            width={width}
            height={height}
            confettiSource={{
              w: 10,
              h: 10,
              x: width / 2,
              y: height / 2,
            }}
            gravity={0.03}
            numberOfPieces={30}
            colors={["#E6007A", "#552BBF", "#00B2FF", "#56F39A", "#D3FF33"]}
            run={confetti}
          />
        </div>
      )}
    </>
  );
}
