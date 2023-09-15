"use client";

import { SendAndFinalizeResult, ToastType } from "@/types";
import { Signer, SubmittableExtrinsic } from "@polkadot/api/types";
import { toast as hotToast, Toast, ToastOptions } from "react-hot-toast";
import { Header } from "@polkadot/types/interfaces";
import { useSubstrateChain } from "@/context/substrate-chain-context";
import { useAppStore } from "@/app/zustand";
import { ApiPromise } from "@polkadot/api";

export const defaultToastMessages = [
  `(1/3) Awaiting your signature`,
  `(2/3) Waiting for transaction to enter block`,
  `(3/3) Waiting for block finalization`,
  `Transaction successful`,
  `Transaction failed`,
];

type TxTypes =
  | string
  | SubmittableExtrinsic<any>[]
  | SubmittableExtrinsic<any>
  | undefined;

/**
 * @see https://polkadot.js.org/docs/api/cookbook/tx
 * @param {*} api
 * @param {*} tx
 * @param {*} signer
 * @param {*} address
 * @returns
 */
export const sendAndFinalize = async (
  api: ApiPromise | undefined,
  tx: TxTypes,
  signer: Signer | undefined,
  address: string | undefined,
  toast: ToastType = {
    title: "Processing Transaction",
    messages: defaultToastMessages,
  }
): Promise<SendAndFinalizeResult | unknown> => {
  let toastId: string | undefined = undefined;

  let toastMessages =
    toast?.messages || toast.messages?.length !== 5
      ? defaultToastMessages
      : toast.messages;

  if (toast) {
    toastId = hotToast.loading(toastMessages[0], {
      // @ts-ignore
      title: toast.title,
      className: "toaster",
    });
  }

  return new Promise(async (resolve, reject) => {
    let success = false;
    let included = [];
    let blockHeader: Header | undefined;

    if (!api || typeof api === "undefined") {
      reject("api is not ready");
      return;
    }

    if (!signer) {
      reject("signer is not ready");
      return;
    }

    if (!tx) {
      reject("invalid tx");
      return;
    }

    if (!address) {
      reject("invalid address");
      return;
    }

    await api.isReady;

    // if someone passes a hex encoded tx we need to decode it
    const maybeHexTxToSubmittable = (
      tx: SubmittableExtrinsic<any> | string
    ) => {
      if (typeof tx === "string") {
        return api?.tx(tx);
      }
      return tx;
    };

    let call: SubmittableExtrinsic<any> | undefined;

    if (Array.isArray(tx)) {
      const txs = tx.map(
        maybeHexTxToSubmittable
      ) as SubmittableExtrinsic<any>[];
      call = api.tx.utility.batchAll(txs);
    } else {
      call = maybeHexTxToSubmittable(tx);
    }

    if (typeof call === "undefined" || !call?.signAndSend) {
      reject("call is not ready");
      return;
    }

    try {
      const unsub = await call.signAndSend(
        address,
        { signer: signer },
        async (result) => {
          const { status, dispatchError, events = [], txHash } = result;
          if (status.isReady) {
            if (toastId) {
              hotToast.loading(toastMessages[1], {
                id: toastId,
              });
            }
          } else if (status.isInBlock) {
            success = dispatchError ? false : true;
            const signedBlock = await api?.rpc.chain.getBlock(status.asInBlock);
            blockHeader = signedBlock?.block.header;
            included = [...events];
            if (toastId) {
              hotToast.loading(toastMessages[2], {
                id: toastId,
              });
            } else {
              console.log("transaction in block waiting for finalization");
            }
          } else if (status.isFinalized) {
            console.log(
              `Transaction included at blockHash ${status.asFinalized}`
            );
            // events.forEach(({ phase, event: { data, method, section } }) => {
            //   // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`)
            // });

            if (dispatchError) {
              if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api?.registry.findMetaError(
                  dispatchError.asModule
                );
                const { docs, name, section } = decoded || {};

                reject(docs?.join(" "));
              } else {
                // Other, CannotLookup, BadOrigin, no extra info
                reject({ status: "error", message: dispatchError.toString() });
              }

              if (toastId) {
                hotToast.error(toastMessages[4], {
                  id: toastId,
                  duration: 4000,
                });
              }
            } else {
              if (toastId) {
                hotToast.success(toastMessages[3], {
                  id: toastId,
                  duration: 4000,
                });
              }

              resolve({
                status: "success",
                message: `success signAndSend ${tx.toString()}`,
                events,
                txHash: txHash.toString(),
                blockHeader,
              });
            }
          }
        }
      );
      unsub;
    } catch (error) {
      console.error("signAndSend cancelled", error);
      if (toastId) {
        hotToast.dismiss(toastId);
      }
      reject(error);
    }
  }).catch((error) => {
    console.error("sendAndFinalize error", error);

    if (toastId) {
      hotToast.dismiss(toastId);
    }
    return {
      status: "error",
      message: error,
    };
  });
};
