import Vote from "@w3f/polkadot-icons/keyline/Vote";
import { UIReferendum } from "../types";
import { Button } from "@/components/Button";

export default function ReferendumVoteButtons({
  referendum,
  userVote,
}: {
  referendum: UIReferendum;
  userVote: any;
}) {
  return (
    <div>
      <Button className="w-full rounded-sm h-unit-12 mb-2" color="vivid">
        Vote Now <Vote width={18} height={18} stroke="currentColor" />
      </Button>
    </div>
  );
}
