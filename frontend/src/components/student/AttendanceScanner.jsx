import React, {useEffect} from "react";
import { useFaceAttendance } from "@/hooks/useFaceAttendance";


export default function AttendanceScanner({ storedDescriptor, onSuccess }) {
  const {
    videoRef,
    status,
    error,
    challenge,
    challengePassed,
    multipleFaces,
    startVideo,
    captureDescriptor,
    lastDescriptor,
  } = useFaceAttendance({
    storedDescriptor,
    matchThreshold: 0.45,
  });

    useEffect(() => {
    if (status === "success" && lastDescriptor && onSuccess) {
      onSuccess({ descriptor: lastDescriptor, liveness: true });
    }
    // eslint-disable-next-line
  }, [status, lastDescriptor]);

  const challengeText = {
    blink: "Please blink your eyes 👁️",
    smile: "Please smile wide 😃",
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative rounded-lg border shadow overflow-hidden bg-black">
        <video
          ref={videoRef}
          width={360}
          height={270}
          autoPlay
          muted
          style={{ objectFit: "cover" }}
          className={status === "matching" ? "opacity-90" : ""}
        />
        
        {/* Scanning Overlay */}
        {status === "matching" && (
          <div className="absolute inset-0 pointer-events-none">
             <div className="w-full h-1 bg-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
             <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded animate-pulse">
                Scanning...
             </div>
          </div>
        )}
      </div>

      <div className="w-full text-center min-h-[60px]">
        {status === "loading" && <p className="animate-pulse">Loading face models...</p>}
        {status === "ready" && <p>Starting camera...</p>}
        
        {status === "matching" && (
            <p className="text-muted-foreground">Looking for your face...</p>
        )}

        {status === "liveness" && challenge && (
          <div className="space-y-2 animate-bounce">
            <p className="text-xl font-bold text-primary">{challengeText[challenge]}</p>
            <p className="text-xs text-muted-foreground">To prove you are real</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center text-green-600 gap-2">
            <span className="text-4xl">🎉</span>
            <p className="font-bold">Attendance Marked!</p>
          </div>
        )}

        {multipleFaces && (
          <p className="text-red-500 font-bold bg-red-100 px-3 py-1 rounded-full inline-block">
             ⚠️ Only one person allowed!
          </p>
        )}
        
        {error && !multipleFaces && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}