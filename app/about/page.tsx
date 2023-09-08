import { title } from "@/components/primitives";
import { Roadmap } from "@/app/about/roadmap";
import { FAQ } from "@/app/about/faq";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <>
      <h1 className={title({ siteTitle: true })}>About</h1>
      <section className="w-full">
        <div className="flex flex-col mx-auto md:flex-row">
          <div className="w-full pr-5 md:w-3/12 xl:pr-12">
            <h3 className="text-3xl font-bold leading-7">Our mission</h3>
          </div>
          <div className="w-full mt-5 md:mt-0 md:w-4/5 md:pl-2">
            <p className="text-base font-normal ">
              Through increased participation in our governance systems, we are
              making the network more secure and resilient to attacks. We have
              designed a system that incentivises token holders to participate
              in governance. Read below how that looks in practice.
            </p>
          </div>
        </div>
      </section>
      <section className="w-full py-20">
        <div className="flex flex-col  mx-auto md:flex-row">
          <div className="w-full pr-5 md:w-3/12 xl:pr-12">
            <h3 className="text-3xl font-bold leading-7">How we do it</h3>
          </div>
          <div className="w-full mt-5 md:mt-0 md:w-4/5 md:pl-2">
            <h4 className=" font-bold">Free NFTs</h4>
            <p className="text-base font-normal ">
              We built a UI that allows anyone to send customizable NFTs to
              voters of any past referendum.
            </p>
            <h4 className=" font-bold pt-4">Bigger vote = rarer NFT</h4>
            <p className="text-base font-normal ">
              For each referendum there are multiple types of NFTs with
              different rarities that voters will receive. The type of NFT each
              voter will receive depends on a “luck factor”. This “luck factor”
              can be influenced by a voter to a given extent. Wallets with more
              funds locked in democracy for longer periods are more likely to
              receive one of the rarer NFTs.
            </p>
            {/* <h4 className=" font-bold pt-4">Educated vote = rarer NFT</h4>
            <p className="text-base font-normal ">
            Another way to increase your chance at the rarer NFTs is by correctly answering the referendum quiz on this site. Getting all answers correct gives voters a higher chance at receiving epic and rare NFTs! We want to encourage educated votes!
            </p> */}
            <h4 className=" font-bold pt-4">Minimum voting requirement</h4>
            <p className="text-base font-normal ">
              Wallets that do not meet the minimum KSM requirements will receive
              the least rare NFTs with a 90% royalty.
            </p>
          </div>
        </div>
      </section>
      <section className="w-full">
        <div className="flex flex-col  mx-auto md:flex-row">
          <div className="w-full pr-5 md:w-3/12 xl:pr-12">
            <h3 className="text-3xl font-bold leading-7">Utility</h3>
          </div>
          <div className="w-full mt-5 md:mt-0 md:w-4/5 md:pl-2">
            <p className="text-base font-normal ">
              These NFTs are a visual representation of a wallets on-chain
              participation in Kusama governance. It would not be surprising to
              see Kusama projects and parachains integrate special rewards for
              NFT recipients. For more information on how to integrate the NFTs
              into your project and the associated benefits, please read{" "}
              <a href="https://docs.google.com/document/d/1KYYT1owxbUnUZq2aO1IxYyLxbTOnGZ2Vj_P2i-zVsFA/edit?usp=sharing">
                here
              </a>
              .
            </p>
          </div>
        </div>
      </section>
      <Roadmap />
      <FAQ />
    </>
  );
}
