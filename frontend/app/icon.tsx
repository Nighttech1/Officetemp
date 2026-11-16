import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Bright green DocSaaS mark — fixes favicon 404 (C-155). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111111",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#22C55E",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: -1,
          }}
        >
          D
        </div>
      </div>
    ),
    { ...size },
  );
}
