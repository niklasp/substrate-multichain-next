"use client";

import { ToastType } from "@/types";
import { Toast, ToastBar } from "react-hot-toast";

export const AppToastBar = (t: Toast) => (
  <ToastBar toast={t}>
    {({ icon, message }) => (
      <>
        {icon}
        <div className="message flex flex-col mx-3 text-sm">
          {/* @ts-ignore */}
          <span className="font-bold">{t.title}</span>
          {message}
        </div>
      </>
    )}
  </ToastBar>
);
