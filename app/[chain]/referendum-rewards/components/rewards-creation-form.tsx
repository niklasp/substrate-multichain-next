// import "@polkadot/rpc-augment";
// import "@polkadot/api-augment/kusama";
// import { useEffect, useState } from "react";
// import { useForm, FormProvider, useFormContext } from "react-hook-form";
// import debounce from "lodash.debounce";

// import { defaultReferendumRewardsConfig } from "../../../data/default-referendum-rewards-config";
// import useAppStore from "../../../zustand";

// import style from "./rewards-creation-form.module.scss";

// import { usePastReferendaIndices } from "../../../hooks/use-gov2";
// import { useIsMounted } from "../../../hooks/use-is-mounted";
// import { bnToBn, formatBalance } from "@polkadot/util";

// import {
//   Input,
//   Select,
//   SelectItem,
//   Button as UIButton,
//   Skeleton,
//   Textarea,
//   useDisclosure,
// } from "@nextui-org/react";
// import { websiteConfig } from "../../../data/website-config";
// import {
//   executeAsyncFunctionsInSequence,
//   mapPromises,
// } from "../../../utils/utils";
// import { RewardsCreationRarityFields } from "./rewards-creation-rarity-field";
// import { useCollectionData } from "../../../hooks/use-collection-data";
// import { useNftCollection } from "../../../hooks/use-chain-config";
// import { u32 } from "@polkadot/types-codec";
// import {
//   getAccountBalanceAssetHubKusama,
//   useAccountBalance,
// } from "../../../hooks/use-account-balance";

// export function RewardsCreationForm() {
//   const { openModal, closeModal } = useModal();
//   const { onOpen } = useDisclosure();
//   const connectedAccountIndex = useAppStore(
//     (state) => state.user.connectedAccount
//   );
//   const connectedAccount = useAppStore(
//     (state) => state.user.connectedAccounts?.[connectedAccountIndex]
//   );
//   const ksmAddress = connectedAccount?.ksmAddress;
//   const walletAddress = connectedAccount?.address;
//   const wallet = getWalletBySource(connectedAccount?.source);

//   const [isMoreInfo, setIsMoreInfo] = useState(false);
//   const [callData, setCallData] = useState<GenerateRewardsResult>();
//   const [isCallDataLoading, setIsCallDataLoading] = useState(false);

//   const [isNewCollectionLoading, setIsNewCollectionLoading] = useState(false);
//   const [error, setError] = useState({
//     message: "",
//     name: "",
//   });
//   const [isOverlayVisible, setIsOverlayVisible] = useState(false);
//   const [isComplete, setIsComplete] = useState(false);
//   const [collectionOwnerIsWallet, setCollectionOwnerIsWallet] = useState(false);
//   const [accountBalanceAssetHubKusama, setAccountBalanceAssetHubKusama] =
//     useState(undefined);

//   const isMounted = useIsMounted();

//   const formMethods = useForm({
//     defaultValues: defaultReferendumRewardsConfig,
//   });

//   const { data: pastReferendaIndices, isLoading: isPastRefIndicesLoading } =
//     usePastReferendaIndices();

//   const {
//     watch,
//     setValue,
//     setError: setFormError,
//     clearErrors,
//     formState: { errors, isSubmitting, isDirty, isValid },
//   } = formMethods;

//   //calculate the maximum natural number < nft_batch_size_max that is a multiple of txsPerVote
//   const maxTxsPerBatch =
//     Math.floor(
//       websiteConfig.nft_batch_size_max / callData?.txsCount?.txsPerVote
//     ) * callData?.txsCount?.txsPerVote;

//   // group the kusamaAssetHubTxs in batches of max size maxTxsPerbatch making sure that txs belonging together (multiples of 13) are never split to different batches
//   const kusamaAssetHubTxsBatches = callData?.kusamaAssetHubTxs?.reduce(
//     (acc, tx, index) => {
//       const batchIndex = Math.floor(index / maxTxsPerBatch);
//       if (!acc[batchIndex]) {
//         acc[batchIndex] = [];
//       }
//       acc[batchIndex].push(tx);
//       return acc;
//     },
//     []
//   );

//   // useEffect(() => {
//   //   if (pastReferendaIndices?.length)
//   //     setValue("refIndex", pastReferendaIndices[0]);
//   // }, [pastReferendaIndices]);

//   const watchFormFields = watch();

//   useEffect(() => {
//     const checkAccountBalance = async () => {
//       if (!ksmAddress) return;
//       const { data } = await getAccountBalanceAssetHubKusama(ksmAddress);

//       setAccountBalanceAssetHubKusama(data?.free);
//     };

//     checkAccountBalance();
//   }, [ksmAddress]);

//   useEffect(() => {
//     const checkCollectionOwner = debounce(async () => {
//       if (!watchFormFields?.collectionConfig?.id) {
//         clearErrors("collectionConfig.id");
//         return;
//       }
//       const apiKusamaAssetHub = await getApiKusamaAssetHub();
//       try {
//         const collectionData = await apiKusamaAssetHub.query.nfts.collection(
//           watchFormFields.collectionConfig.id
//         );
//         const ownsCollection =
//           (collectionData?.toJSON() as any).owner === ksmAddress;

//         setCollectionOwnerIsWallet(ownsCollection);

//         if (!ownsCollection) {
//           console.log("not owner");
//           setFormError("collectionConfig.id", {
//             type: "invalid",
//             message: "You are not the owner of this collection",
//           });
//         } else {
//           clearErrors("collectionConfig.id");
//         }
//       } catch (error) {
//         console.log("invalid input");
//       }
//     }, 500);
//     checkCollectionOwner();
//   }, [watchFormFields.collectionConfig.id]);

//   //TODO type
//   async function generatePreimage(formData) {
//     console.log("Form data is", JSON.stringify(formData, null, 2));
//     if (!walletAddress) {
//       setError({
//         message: "Please connect your wallet to continue.",
//         name: "Wallet not connected",
//       });
//       return;
//     }

//     setIsCallDataLoading(true);
//     setIsOverlayVisible(true);

//     try {
//       setError({ message: "", name: "" });

//       const res = await fetch("/api/create-rewards-calls", {
//         method: "POST",
//         body: formData,
//       });

//       const jsonRes = await res.json();
//       console.info("result from api ", jsonRes);

//       if (jsonRes.name === "Error") {
//         console.info(" frontend", jsonRes);
//         setError(jsonRes);
//       } else {
//         setCallData(jsonRes);
//       }

//       setIsCallDataLoading(false);
//     } catch (error) {
//       console.info(" frontend", error);
//       setError(error);
//       setIsCallDataLoading(false);
//     }
//   }

//   async function signAndSend() {
//     await wallet?.enable("Proof of Chaos");
//     const signer = wallet.signer;

//     const apiKusamaAssetHub = await getApiKusamaAssetHub();

//     console.log("kusamaAssetHubTxsBatches", kusamaAssetHubTxsBatches);

//     // execute sendAndFinalize for each batch and record the results
//     const userSignatureRequests = kusamaAssetHubTxsBatches.map((batch) => {
//       return async () =>
//         sendAndFinalize(apiKusamaAssetHub, batch, signer, walletAddress);
//     });

//     try {
//       const allSignatureResults = await executeAsyncFunctionsInSequence(
//         userSignatureRequests
//       );
//       console.log("allSignatureResults", allSignatureResults);

//       if (allSignatureResults.every((res) => res.status === "success")) {
//         setIsComplete(true);
//         const configReqBody = {
//           ...callData.config,
//           blockNumbers: allSignatureResults.map((res) =>
//             res.blockHeader.number.toNumber()
//           ),
//           txHashes: allSignatureResults.map((res) => res.txHash),
//         };

//         const createConfigRes = await fetch("/api/create-config-nft", {
//           method: "POST",
//           body: JSON.stringify(configReqBody),
//         });
//         console.log("create Config NFT result", createConfigRes);
//       }
//     } catch {
//       console.info("error sending tx", error);
//       setError(error);
//     }
//     // try {
//     //   const { status, blockHeader, txHash } = await sendAndFinalize(
//     //     apiKusamaAssetHub,
//     //     //TODO is this still needed? does sendAndFinalize do it?
//     //     callData.kusamaAssetHubTxs.map((tx) => apiKusamaAssetHub.tx(tx)),
//     //     signer,
//     //     walletAddress
//     //   );

//     //   if (status === "success") {
//     //     setIsComplete(true);

//     //     const configReqBody = {
//     //       ...callData.config,
//     //       blockNumber: blockHeader.number.toNumber(),
//     //       txHash,
//     //     };

//     //     const createConfigRes = await fetch("/api/create-config-nft", {
//     //       method: "POST",
//     //       body: JSON.stringify(configReqBody),
//     //     });
//     //     console.log("create Config NFT result", createConfigRes);
//     //   }
//     // } catch (error) {
//     //   console.info("error sending tx", error);
//     //   setError(error);
//     // }
//   }

//   function onCancel() {
//     setIsOverlayVisible(false);
//     setIsComplete(false);
//   }

//   async function onSubmit(data) {
//     console.log("submit formErrors", errors);
//     console.table(data);

//     setCallData(undefined);

//     // we use form data because we are also transmitting files
//     const formData = new FormData();

//     formData.append(
//       "data",
//       JSON.stringify({
//         ...data,
//         sender: walletAddress,
//       })
//     );

//     // that are appended to the form data in respective key value pairs
//     // e.g. commonFile => FileObject
//     data.options.forEach((option) => {
//       if (!option.imageCid) {
//         formData.append(
//           `${option.rarity}File`,
//           option.file[0],
//           option.file[0].name
//         );
//       }
//     });

//     if (data.collectionConfig.isNew) {
//       formData.append(
//         "collectionImage",
//         data.collectionConfig.file[0],
//         data.collectionConfig.file[0].name
//       );
//     }

//     generatePreimage(formData);
//   }

//   // function is passed to the modal in order to change the state of the form fields
//   function setCollectionConfig(collectionConfig: CollectionConfiguration) {
//     setValue("collectionConfig", {
//       ...watchFormFields.collectionConfig,
//       ...collectionConfig,
//     });
//   }

//   async function createNewCollection() {
//     console.log("creating new collection");
//     openModal("NEW_NFT_COLLECTION", {
//       config: watchFormFields,
//       sender: walletAddress,
//       setCollectionConfig,
//       setIsNewCollectionLoading,
//     });
//   }

//   const isEnoughBalance =
//     accountBalanceAssetHubKusama &&
//     bnToBn(accountBalanceAssetHubKusama).gt(bnToBn(callData?.fees?.deposit));

//   return (
//     <div className={style.formWrapper}>
//       {isMounted && (
//         <FormProvider {...formMethods}>
//           {!walletAddress ? (
//             <div>Please connect your wallet to proceed</div>
//           ) : (
//             <form
//               onSubmit={formMethods.handleSubmit(onSubmit)}
//               onError={console.log}
//               className={style.form}
//             >
//               <h1 className="text-2xl relative">
//                 Create Rewards for a Referendum
//                 <span className="pl-2 text-base text-sky-600 translate-y-6">
//                   beta
//                 </span>
//               </h1>

//               <p className="text-xs mb-4">
//                 Here you can create signable transactions for sending out NFTs
//                 to users who voted on a referendum. <br></br>If you find any 🪲,
//                 or want a new feature, please{" "}
//                 <a href="https://github.com/Proof-Of-Chaos/website/issues">
//                   file a github issue here
//                 </a>
//               </p>

//               <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
//                 <Select
//                   isRequired
//                   label="Referendum Index"
//                   isLoading={isPastRefIndicesLoading}
//                   placeholder={"Select any past referendum"}
//                   description={
//                     "Select any past referendum to prepare the NFT sendouts for"
//                   }
//                   {...formMethods.register("refIndex", {
//                     validate: {},
//                   })}
//                 >
//                   {pastReferendaIndices?.map((refIdx) => (
//                     <SelectItem key={refIdx} value={refIdx}>
//                       {refIdx}
//                     </SelectItem>
//                   ))}
//                 </Select>

//                 <Input
//                   isRequired
//                   label="Royalty Address"
//                   type="text"
//                   placeholder="Enter the address of the royalty receiver"
//                   description="Where trading royalties should go to (Kusama / Asset Hub).
//                   80% will go to the entered address, 20% to the Proof of Chaos multisig: Go8NpTvzdpfpK1rprXW1tE4TFTHtd2NDJCqZLw5V77GR8r4."
//                   {...formMethods.register("royaltyAddress", {
//                     validate: {},
//                   })}
//                 />
//               </div>

//               <>
//                 <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4 items-center">
//                   <Input
//                     isRequired
//                     label="Collection Id"
//                     placeholder="The id of your existing collection"
//                     type="text"
//                     errorMessage={errors.collectionConfig?.id?.message}
//                     description="Select a collection that you are the owner of. NFTs will be minted to this collection."
//                     disabled={isNewCollectionLoading}
//                     validationState={
//                       errors.collectionConfig?.id ? "invalid" : "valid"
//                     }
//                     {...formMethods.register("collectionConfig.id", {
//                       validate: {
//                         isNumber: (value) =>
//                           !isNaN(value) || "Not a valid number",
//                         isNotCollectionOwner: () =>
//                           collectionOwnerIsWallet ||
//                           "You are not the owner of the collection",
//                       },
//                     })}
//                   />
//                   <p>{errors?.["collectionConfig.id"]?.message}</p>
//                   <div className="flex h-100">or</div>
//                   <UIButton
//                     className="w-full"
//                     onClick={createNewCollection}
//                     color="secondary"
//                     isLoading={isNewCollectionLoading}
//                     variant="bordered"
//                   >
//                     {isNewCollectionLoading
//                       ? "Creating a new collection ..."
//                       : "Create A New Collection"}
//                   </UIButton>
//                 </div>
//               </>

//               <label className="mt-4 form-label block text-sm font-bold tracking-wider text-gray-900 dark:text-white">
//                 NFTs
//               </label>
//               <p className="form-helper">
//                 You can create 3 different types of NFTs, each with varying
//                 rarity, by uploading an image and providing metadata. The
//                 mapping of voter -&gt; rarity is performed by the POC algorithm,
//                 which takes several metrics into account and introduces an
//                 element of randomness.
//               </p>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4 w-full">
//                 {["common", "rare", "epic"].map((rarity, index) => {
//                   // const fields = watchFormFields.options[index];
//                   return (
//                     <RewardsCreationRarityFields
//                       key={rarity}
//                       rarity={rarity}
//                       refConfig={watchFormFields}
//                       register={formMethods.register}
//                       errors={errors}
//                     />
//                   );
//                 })}
//               </div>

//               {errors["refIndex"] &&
//                 errors["refIndex"].type === "positiveNumber" && (
//                   <p className="form-error">
//                     Your vote amount must be a positive number
//                   </p>
//                 )}
//               {errors["refIndex"] &&
//                 errors["refIndex"].type === "hasEnoughFunds" && (
//                   <p className="form-error">
//                     You do not have enough available KSM
//                   </p>
//                 )}
//               <p className="form-helper pt-2 text-center">
//                 Hitting &quot;Submit&quot; will generate the required
//                 transactions for sending NFTs to all voters. You can then sign
//                 these transactions in the subsequent step to record them on the
//                 blockchain.
//               </p>
//               <Button
//                 type="submit"
//                 variant="primary"
//                 className="w-full mt-4"
//                 disabled={isCallDataLoading}
//               >
//                 Submit Referendum Rewards
//               </Button>
//             </form>
//           )}
//         </FormProvider>
//       )}
//       {isOverlayVisible && (
//         <div className={style.overlay}>
//           {isCallDataLoading && (
//             <>
//               <Loader
//                 className="w-12 h-12"
//                 text="Creating transactions for reward distribution"
//               />
//               <p className="text-xs"></p>
//               <ul className="text-xs">
//                 <li>Pinning your images and NFT metadata to IPFS ...</li>
//                 <li>
//                   Generating all required transactions to distribute the rewards
//                   to all voters of the selected referendum ...
//                 </li>
//               </ul>
//               <p className="text-xs mt-5">
//                 Please stand by this may take a while ...
//               </p>
//             </>
//           )}
//           {!isCallDataLoading && (
//             <>
//               {callData && !isComplete && (
//                 <>
//                   <h3 className="text-lg">
//                     🎉🛠️ Your transactions were successfully created ⛓️🎉
//                   </h3>
//                   {/* <Button
//                     className="mt-2"
//                     size="mini"
//                     variant="secondary"
//                     onClick={() => setIsMoreInfo(!isMoreInfo)}
//                   >
//                     {isMoreInfo ? "⬆️ Less Info" : "💡 More Info"}
//                   </Button> */}
//                 </>
//               )}
//               {error.message !== "" && (
//                 <div>
//                   <h3 className="text-lg">
//                     ⚠️ Error generating your calls, please try again.
//                   </h3>
//                   <p className="text-red-500">{error.message}</p>
//                 </div>
//               )}
//               {callData && callData.distribution && !isComplete && (
//                 <div className="text-sm">
//                   <p className="mt-8">
//                     The txs you sign will mint{" "}
//                     <b>{callData.voters?.length} NFTs</b> (
//                     {callData?.distribution?.common} common,{" "}
//                     {callData?.distribution?.rare} rare,{" "}
//                     {callData?.distribution?.epic} epic) to{" "}
//                     <b>collection {watchFormFields.collectionConfig.id}</b>
//                   </p>
//                   <p className="mt-2">
//                     Fees (Kusama Asset Hub):{" "}
//                     {formatBalance(callData?.fees?.nfts, {
//                       decimals: 12,
//                       forceUnit: "-",
//                       withSi: true,
//                       withUnit: "KSM",
//                     })}{" "}
//                     KSM
//                   </p>
//                   <p className="">
//                     Locked Deposit (Kusama Asset Hub):{" "}
//                     {callData?.fees?.deposit &&
//                       formatBalance(callData?.fees?.deposit, {
//                         decimals: 12,
//                         forceUnit: "-",
//                         withSi: true,
//                         withUnit: "KSM",
//                       })}
//                     KSM
//                   </p>
//                   <p>Transaction Count: {callData.txsCount.nfts}</p>
//                   <h2>
//                     your account balance is{" "}
//                     {formatBalance(accountBalanceAssetHubKusama, {
//                       decimals: 12,
//                       forceUnit: "-",
//                       withSi: true,
//                       withUnit: "KSM",
//                     })}
//                   </h2>
//                   <p className="mt-2 text-lg">
//                     You will be asked to{" "}
//                     <b>
//                       sign {kusamaAssetHubTxsBatches.length} transactions in
//                       sequence
//                     </b>
//                     . For a complete sendout, you will have to sign all of them.{" "}
//                   </p>
//                 </div>
//               )}
//               {callData && isComplete && (
//                 <div>
//                   <h3 className="text-2xl">
//                     🚀 The txs you signed minted{" "}
//                     <b>{callData.voters?.length} NFTs</b> 🚀
//                   </h3>
//                 </div>
//               )}
//               <div className="button-wrap pt-8">
//                 <Button className="mr-4" onClick={onCancel} variant="cancel">
//                   {isComplete || !callData ? "Close" : "Cancel"}
//                 </Button>
//                 {!isComplete && callData && (
//                   <>
//                     {/* {JSON.stringify(bnToBn(accountBalanceAssetHubKusama))}
//                     {JSON.stringify(bnToBn(callData.fees?.deposit))} */}
//                     {!isEnoughBalance ? (
//                       <p className="text-red-500">
//                         You do not have enough KSM to pay the fees. Please top
//                         up your account.
//                       </p>
//                     ) : (
//                       <Button onClick={signAndSend} variant="primary">
//                         🔏 Sign and Send 📤
//                       </Button>
//                     )}
//                   </>
//                 )}
//                 {isComplete && (
//                   <a
//                     href={`https://kodadot.xyz/stmn/collection/${watchFormFields.collectionConfig.id}`}
//                     target="_blank"
//                   >
//                     <Button variant="primary">🎉 View on Kodadot</Button>
//                   </a>
//                 )}
//               </div>
//             </>
//           )}
//         </div>
//       )}
//       {/* <pre className="text-[0.5rem]">
//         file: {JSON.stringify(watchFormFields.options[0]?.file?.[0], null, 2)}
//         form fields: {JSON.stringify(watchFormFields, null, 2)}
//       </pre> */}
//       {/* <pre className="text-[0.5rem]">
//         call config:
//         {JSON.stringify(callData?.config, null, 2)}
//       </pre> */}
//       {/* <pre className="text-[0.5rem] break-spaces">
//         preimage hex:
//         {callData?.preimage}
//       </pre> */}
//     </div>
//   );
// }
