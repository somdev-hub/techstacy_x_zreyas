"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "sonner";
import Link from 'next/link';

type ClueHistory = {
  clue: string;
  scannedAt: string;
  isLatest: boolean;
  clueNumber: number;
};

const TreasureHunt = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const [clueHistory, setClueHistory] = useState<ClueHistory[]>([]);
  const [latestClue, setLatestClue] = useState<string | null>(null);
  const [isHuntStarted, setIsHuntStarted] = useState(false);
  const [currentClueNumber, setCurrentClueNumber] = useState(0);
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scanInProgressRef = useRef(false);

  // Fetch team's clue history
  const fetchClueHistory = async () => {
    try {
      const response = await fetch("/api/events/treasure-hunt/my-clues");
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404 || data.error === 'Team not registered') {
          setIsRegistered(false);
          return;
        }
        throw new Error(data.error || "Failed to fetch clues");
      }
      
      setIsRegistered(true);
      setClueHistory(data.clues || []);
      setLatestClue(data.latestClue);
      setIsHuntStarted(data.isHuntStarted);
      setCurrentClueNumber(data.currentClueNumber);
      setIsAttendanceMarked(data.isAttendanceMarked);
    } catch (error) {
      console.error('Error fetching clues:', error);
      setIsRegistered(false);
      toast.error("Failed to fetch your clues");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClueHistory();
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.error("Error clearing scanner:", error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScannerInitialized(false);
  }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    // Prevent multiple simultaneous scan attempts
    if (scanInProgressRef.current) return;
    
    try {
      scanInProgressRef.current = true;
      console.log("QR code detected:", decodedText);
      
      // First try scanning as regular clue
      const response = await fetch('/api/events/treasure-hunt/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode: decodedText }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Clue found!");
        setLatestClue(data.clue);
        fetchClueHistory();
        stopScanner();
        return;
      }

      // If regular scan fails, try as winner QR
      const winnerResponse = await fetch('/api/events/treasure-hunt/scan-winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode: decodedText }),
      });

      const winnerData = await winnerResponse.json();

      if (!winnerResponse.ok) {
        throw new Error(winnerData.error || 'Failed to process QR code');
      }

      stopScanner();

      if (winnerData.isWinner) {
        toast.success("🎉 " + winnerData.message, {
          duration: 10000,
          style: {
            background: 'linear-gradient(to right, #4F46E5, #3730A3)',
            color: 'white',
          },
        });
      } else {
        toast(winnerData.message, {
          duration: 5000,
          style: { 
            background: '#FEF3C7', // Light yellow background
            color: '#92400E', // Dark amber text
            border: '1px solid #F59E0B', // Amber border
          },
        });
      }
      
      fetchClueHistory();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process QR code');
    } finally {
      scanInProgressRef.current = false;
    }
  }, [stopScanner]);

  const onScanFailure = useCallback((error: Error | string) => {
    // Ignore frequent scan failures when no QR code is detected
    // console.debug("QR scan error:", error);
  }, []);

  const startScanner = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
  }, [isScanning]);

  useEffect(() => {
    if (isScanning && !scannerInitialized) {
      // Small timeout to ensure DOM element is ready
      const timeoutId = setTimeout(() => {
        try {
          const qrContainer = document.getElementById("qr-reader");
          if (!qrContainer) {
            console.error("QR reader container not found");
            return;
          }

          // Clean up any previous instances
          while (qrContainer.firstChild) {
            qrContainer.removeChild(qrContainer.firstChild);
          }

          const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              rememberLastUsedCamera: true,
            },
            /* verbose= */ false
          );

          scannerRef.current = scanner;
          scanner.render(onScanSuccess, onScanFailure);
          setScannerInitialized(true);
        } catch (error) {
          console.error("Failed to initialize QR scanner:", error);
          toast.error("Failed to initialize camera. Please try again.");
          setIsScanning(false);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isScanning, scannerInitialized, onScanSuccess, onScanFailure]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Error cleaning up scanner:", error);
        }
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (isRegistered === false) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-neutral-800 rounded-xl p-8 max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Team Registration Required</h2>
          <p className="text-neutral-400 mb-6">
            You need to register your team for the Treasure Hunt event before you can participate. Please head over to the events page to register your team.
          </p>
          <Link
            href="/dashboard/home"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Go to Events Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Current Clue and Scanner Section */}
        <div className="bg-neutral-800 rounded-xl shadow-md p-4 lg:w-1/2">
          <h1 className="text-xl font-bold mb-4">Current Clue</h1>
          {!isAttendanceMarked ? (
            <div className="bg-yellow-900/50 border border-yellow-600/50 rounded-lg p-4 mb-4">
              <p className="text-yellow-200">⚠️ Your attendance needs to be marked before you can participate in the treasure hunt. Please find an event coordinator to mark your attendance.</p>
            </div>
          ) : !isHuntStarted ? (
            <div className="bg-neutral-700 rounded-lg p-4 mb-4">
              <p className="text-neutral-400">Waiting for the hunt to begin...</p>
            </div>
          ) : latestClue ? (
            <div className="bg-neutral-700 rounded-lg p-4 mb-4">
              <p className="text-sm text-neutral-400 mb-2">Clue {currentClueNumber} of 4</p>
              <p className="text-lg">{latestClue}</p>
            </div>
          ) : (
            <div className="bg-neutral-700 rounded-lg p-4 mb-4">
              <p className="text-neutral-400">No clues found yet. Scan your first QR code!</p>
            </div>
          )}

          {/* Only show scanner if hunt has started */}
          {isHuntStarted && (
            <div className="mt-6">
              <h2 className="text-lg font-bold mb-4">Scan Next Clue</h2>
              {isScanning ? (
                <>
                  <div id="qr-reader" className="w-full h-[300px] bg-neutral-700 rounded-lg overflow-hidden" />
                  <button
                    onClick={stopScanner}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 rounded-md px-4 py-2 transition-colors"
                  >
                    Stop Scanning
                  </button>
                </>
              ) : (
                <button
                  onClick={startScanner}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-md px-4 py-2 transition-colors"
                >
                  Start Scanning
                </button>
              )}
            </div>
          )}
        </div>

        {/* Clue History Section */}
        <div className="bg-neutral-800 rounded-xl shadow-md p-4 lg:w-1/2">
          <h1 className="text-xl font-bold mb-4">Clue History</h1>
          <div className="space-y-4">
            {clueHistory.length > 0 ? (
              clueHistory.map((history, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg ${
                    history.isLatest ? 'bg-blue-900/50' : 'bg-neutral-700'
                  }`}
                >
                  <p className="text-sm text-neutral-400 mb-1">
                    Clue {history.clueNumber} - {new Date(history.scannedAt).toLocaleString()}
                  </p>
                  <p className="text-neutral-200">{history.clue}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-400 p-4">
                No clues in history
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasureHunt;