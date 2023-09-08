export const FAQ = () => {
  return (
    <section className="md:py-24">
      <div className="mx-auto">
        <h2 className="mb-4 text-xl font-bold md:text-3xl">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 gap-0 text-gray-600 md:grid-cols-2 md:gap-16">
          <div>
            <h5 className="mt-10 mb-3 font-semibold text-gray-900">
              What is this project trying to achieve?
            </h5>
            <p>
              Through our incentives we are looking to get more people involved
              in Kusama governance!
            </p>

            <h5 className="mt-10 mb-3 font-semibold text-gray-900">
              When was this project started?{" "}
            </h5>
            <p>
              The RMRK1 collection launched in referendum 171. In Referendum 181
              the composable (RMRK2) Shelf collection was launched. In
              Referendum 232 the Frame collection was launched.
            </p>

            <h5 className="mt-10 mb-3 font-semibold text-gray-900">
              Are you affiliated with Parity or any other organisation?
            </h5>
            <p>
              No, this project was started by the community. The team behind it
              has no affiliations with any other organisation.
            </p>
          </div>
          <div>
            <h5 className="mt-10 mb-3 font-semibold text-gray-900">
              How do I get involved?
            </h5>
            <p>
              <a href="https://discord.gg/MKbjet8QwG">Come join our discord!</a>
              . We would love to have you.{" "}
            </p>

            <h5 className="mt-10 mb-3 font-semibold text-gray-900">
              Will you expand to other parachains?
            </h5>
            <p>
              A major focus is to decentralize the project and through this
              decentralization also demonstrate a path for any and all
              parachains to implement their own incentives programs.
            </p>
            <h5 className="mt-10 mb-3 font-semibold text-gray-900">
              How is this project financed?
            </h5>
            <p>
              The project is financed through royalty revenues from secondary
              sales. Recently we also started to generate income through primary
              sales of some additional collections. The Kusama treasury has been
              very supportive and stepped in to help us cover our costs whenever
              we fell short with our revenues and to help us build faster.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
