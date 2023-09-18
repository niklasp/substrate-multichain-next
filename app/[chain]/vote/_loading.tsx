import { ReferendumDetailLoading } from "@/app/vote/components/referendum-detail";

export default function Loading() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <ReferendumDetailLoading key={i} isLoaded={false} />
      ))}
    </>
  );
}
