import {
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import { useEffect } from "react";
/** Resolved at build time so prerendered HTML includes `<link rel="stylesheet">` (CSS import alone was emitted with no link in SPA shell). */
import appCssHref from "./app.css?url";
import GenerateWalletModal from "~/components/GenerateWalletModal";
import Navbar from "~/components/Navbar";
import StellarKitInit from "~/components/StellarKitInit";
import ToastContainer from "~/components/ui/Toast";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="TELOS — Autonomous agent economy on Stellar: telos-registry for discovery and payTo, web UI with a manager agent that hires specialists via x402 machine payments." />
        <title>TELOS</title>
        <link rel="stylesheet" href={appCssHref} />
      </head>
      <body className="bg-[#000000] text-[#e8e8f0] overflow-x-hidden">
        {/* Fixed atmospheric gradients — break the flat void */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          {/* Nebula wash — top center, behind hero */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 rounded-full"
            style={{
              width: "900px",
              height: "900px",
              background: "radial-gradient(ellipse, rgba(123,47,255,0.03) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          {/* Accretion glow — mid-right */}
          <div
            className="absolute rounded-full"
            style={{
              top: "40%",
              right: 0,
              transform: "translateX(33%)",
              width: "600px",
              height: "600px",
              background: "radial-gradient(ellipse, rgba(255,107,0,0.025) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          {/* Blue wash — mid-left */}
          <div
            className="absolute rounded-full"
            style={{
              top: "65%",
              left: 0,
              transform: "translateX(-25%)",
              width: "500px",
              height: "500px",
              background: "radial-gradient(ellipse, rgba(0,180,255,0.02) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          {/* CTA section glow — bottom */}
          <div
            className="absolute bottom-[10%] left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: "700px",
              height: "300px",
              background: "radial-gradient(ellipse, rgba(255,107,0,0.03) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        {/* Particle dust — CSS ambient layer */}
        <div className="particle-dust" aria-hidden="true">
          {Array.from({ length: 60 }, (_, i) => {
            const left = `${(i * 17 + 3) % 100}%`;
            const size = `${1 + (i % 3)}px`;
            const duration = `${15 + (i * 7) % 25}s`;
            const delay = `${-(i * 4) % 20}s`;
            const opacity = 0.1 + (i % 3) * 0.08;
            return (
              <span
                key={i}
                style={{
                  left,
                  width: size,
                  height: size,
                  animationDuration: duration,
                  animationDelay: delay,
                  opacity,
                  bottom: 0,
                  background: i % 3 === 0
                    ? "rgba(255,107,0,0.6)"
                    : i % 3 === 1
                    ? "rgba(123,47,255,0.6)"
                    : "rgba(255,186,92,0.4)",
                }}
              />
            );
          })}
        </div>

        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Cursor glow
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--cursor-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="relative min-h-screen">
      <StellarKitInit />
      <Navbar />
      <main className="relative z-10">
        <Outlet />
      </main>
      <GenerateWalletModal />
      <ToastContainer />
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-8">
      <div className="text-center max-w-lg">
        <p className="font-ui font-600 text-xs uppercase tracking-[0.2em] text-[#ff6b00] mb-4">
          ANOMALY DETECTED
        </p>
        <h1 className="font-display italic text-6xl text-[#e8e8f0] mb-6">
          {isRouteErrorResponse(error) ? `${error.status}` : "Error"}
        </h1>
        <p className="font-ui font-300 text-[#9898b0] mb-8">
          {isRouteErrorResponse(error)
            ? error.data || "The requested sector does not exist."
            : "An unknown anomaly disrupted the signal."}
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 font-ui font-500 text-sm text-[#ffba5c] bg-[rgba(255,107,0,0.12)] border border-[rgba(255,107,0,0.4)] px-6 py-3 rounded-lg hover:bg-[rgba(255,107,0,0.2)] transition-all"
        >
          Return to Base
        </a>
      </div>
    </div>
  );
}
