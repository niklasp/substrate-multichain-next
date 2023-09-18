import Image from "next/image";

export const ReferendumLinks = ({ referendumId }: { referendumId: string }) => (
  <>
    <div className="referendum-more py-2 px-4 mt-4 border-t-1 border-dashed border-gray-300 rounded-sm flex items-center text-xs">
      <span className="pr-4">View on</span>
      <a
        className="pr-3 grayscale flex"
        href={`https://kusama.polkassembly.io/referenda/${referendumId}`}
      >
        <Image
          src="/logos/polkassembly.svg"
          alt="polkassembly logo"
          height={10}
          width={70}
          className="dark:invert"
        />
      </a>
      <a
        className="flex invert pr-5"
        href={`https://kusama.subscan.io/referenda_v2/${referendumId}`}
      >
        <Image
          src="/logos/subscan.png"
          alt="subscan logo"
          height={12}
          width={70}
          className="dark:invert"
        />
      </a>
      <a
        className="flex grayscale"
        href={`https://kusama.subsquare.io/referenda/referendum/${referendumId}`}
      >
        <Image
          src="/logos/subsquare.svg"
          alt="subscan logo"
          height={10}
          width={80}
          className="dark:invert"
        />
      </a>
    </div>
  </>
);
