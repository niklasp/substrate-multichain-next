import { SubstrateChain } from "@/types";
import { ReferendumDetailLoading } from "./components/referendum-detail";
import { UIReferendum, UITrack } from "./types";

export default function Loading({
  chain,
  referendum,
  track,
}: {
  chain: SubstrateChain;
  referendum: UIReferendum;
  track: UITrack;
}) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <ReferendumDetailLoading
          key={i}
          chain={chain}
          referendum={referendum}
          track={track}
        />
      ))}
    </>
  );
}
