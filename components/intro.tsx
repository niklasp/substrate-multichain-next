export function Intro() {
  return (
    <>
      <p className="font-bold text-3xl">
        <span className="border-4 border-pink-500 py-2 px-5 rounded-full">
          1
        </span>{" "}
        connect / disconnect flow
      </p>
      <p className="text-tiny">
        Connection a wallet browser extension to your site
      </p>
      <ol className="list-outside text-tiny list-decimal text-left max-w-xl">
        <li>
          Do not ask the user to connect to the site without any user action.
        </li>
        <li>
          The user can browse the site without connecting their browser
          extension.
        </li>
        <li>Do not ask again on any subsequent visit after once connected.</li>
        <li>
          Let the user disconnect the browser extension from accessing the site.
        </li>
        <li>
          If the user changed the active account, that setting should be
          remembered.
        </li>
      </ol>
    </>
  );
}
