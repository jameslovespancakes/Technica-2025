import React from "react";

export function SplineBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none w-full h-full">
      <iframe
        src="https://my.spline.design/vaporwavebackground-ZPtrXpxQgpzNeGZwH4mgkar1/"
        frameBorder="0"
        width="100%"
        height="100%"
        style={{
          border: "none",
          pointerEvents: "none",
        }}
        title="Spline Background"
      />
    </div>
  );
}

