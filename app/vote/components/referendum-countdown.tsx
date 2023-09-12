"use client";

import React, { useEffect, useRef, useState } from "react";
import Countdown, { zeroPad } from "react-countdown";
import { useEndDate } from "../hooks/use-end-date";
import { Spinner } from "@nextui-org/spinner";
import { useAppStore } from "@/app/zustand";

const renderer = ({
  days,
  hours,
  minutes,
  seconds,
  completed,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
}) => {
  if (completed) {
    return <div></div>;
  } else {
    return (
      <div className="flex items-center gap-3 text-base justify-center font-medium -tracking-wider text-gray-900 dark:text-gray-100 xs:text-lg md:gap-5 md:text-2xl xl:text-2xl">
        {!!days && (
          <div className="shrink-0 3xl:w-20">
            {zeroPad(days)}
            <span className="md:hidden">d</span>
            <span className="hidden truncate text-sm -tracking-wide text-gray-600 dark:text-gray-400 md:block">
              Days
            </span>
          </div>
        )}
        <div className="shrink-0 3xl:w-20">
          {zeroPad(hours)}
          <span className="md:hidden">h</span>
          <span className="hidden truncate text-sm -tracking-wide text-gray-600 dark:text-gray-400 md:block">
            Hours
          </span>
        </div>
        <div className="shrink-0 3xl:w-20">
          {zeroPad(minutes)}
          <span className="md:hidden">m</span>
          <span className="hidden truncate text-sm -tracking-wide text-gray-600 dark:text-gray-400 md:block">
            Minutes
          </span>
        </div>
        <div className="shrink-0 3xl:w-20">
          {zeroPad(seconds)}
          <span className="md:hidden">s</span>
          <span className="hidden truncate text-sm -tracking-wide text-gray-600 dark:text-gray-400 md:block">
            Seconds
          </span>
        </div>
      </div>
    );
  }
};

export default function ReferendumCountdown({
  endBlock,
}: {
  endBlock: number;
}) {
  const chain = useAppStore((state) => state.chain);

  let { data: endDate, isLoading } = useEndDate(endBlock);

  if (isLoading) {
    return (
      <div className="referendum-countdown">
        <Spinner label="Calculating Remaining Time" />
      </div>
    );
  }

  return (
    <div className="referendum-countdown">
      {endDate && (
        <Countdown
          date={endDate}
          renderer={renderer}
          className="justify-center"
        />
      )}
    </div>
  );
}
