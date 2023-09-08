import { SyntheticEvent, useState } from "react";
import NextImage from "next/image";

export default function Image(props: any) {
  const [ready, setReady] = useState(false);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    event.persist();
    //@ts-ignore
    if (event.target.srcset) {
      setReady(true);
    }
  };

  return (
    <div
      style={{
        opacity: ready ? 1 : 0,
        transition: "opacity .5s ease-in-out",
      }}
    >
      <NextImage onLoad={handleLoad} {...props} />
    </div>
  );
}
