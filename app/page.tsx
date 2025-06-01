"use client";

import { CustomDatePicker } from "@/components/custom-datepicker";

export default function Page() {
  return (
    <div className="p-16 flex items-center justify-center min-h-screen" style={{ backgroundColor: "hsla(0, 0%, 96%, 1)" }}>
      <div 
        className="p-6"
        style={{
          borderRadius: "32px",
          border: "1px solid #FFF",
          background: "#FBFBFB",
          boxShadow: "0px 133px 37px 0px rgba(0, 0, 0, 0.00), 0px 85px 34px 0px rgba(0, 0, 0, 0.00), 0px 48px 29px 0px rgba(0, 0, 0, 0.01), 0px 21px 21px 0px rgba(0, 0, 0, 0.01), 0px 5px 12px 0px rgba(0, 0, 0, 0.01)"
        }}
      >
        <CustomDatePicker />
      </div>
    </div>
  );
}
