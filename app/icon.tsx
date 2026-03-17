import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

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
          backgroundColor: "#000000",
        }}
      >
        <div
          style={{
            fontSize: 132,
            fontWeight: 700,
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: 1,
            letterSpacing: "-2px",

            // gradiente ajustado para ficar visualmente igual ao login
            background:
              "linear-gradient(90deg, #e9891d 0%, #ff8c42 38%, #c94a4a 58%, #e9891d 76%, #3d7a99 92%, #5dc6a1 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          Bravoo
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}