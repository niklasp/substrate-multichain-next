"use client";

//@ts-ignore
import * as Lunicode from "lunicode";
import { use, useEffect, useState } from "react";

export function Logo({ text = "proofofchaos" }: { text?: string }) {
  const [luni, setLuni] = useState<any>(null);
  const [chaosText, setChaosText] = useState(text);
  const [counter, setCounter] = useState(0);

  const reset = () => {
    setCounter(0);
    setChaosText(text);
  };

  useEffect(() => {
    const l = Lunicode;
    l.tools.creepify.options.maxHeight = 1; // How many diacritic marks shall we put on top/bottom? Default: 15
    l.tools.creepify.options.randomization = 0; // 0-100%. maxHeight 100 and randomization 20%: the height goes fro
    setLuni(l);

    const interval = setInterval(() => {
      setCounter((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setChaosText((prev) => {
      const charIndexToChange = Math.floor(Math.random() * text.length);
      const charToChange = text[charIndexToChange];
      let newChar = luni?.tools.creepify.encode(charToChange);

      if (!newChar) {
        newChar = charToChange;
      }

      let newText = prev;
      newText = newText?.replace(charToChange, newChar);

      return newText;
    });
  }, [counter]);

  return (
    <span
      aria-label="proof of chaos"
      className=""
      onMouseOver={reset}
      onTouchStart={reset}
      onClick={reset}
    >
      {chaosText}
    </span>
  );
}
