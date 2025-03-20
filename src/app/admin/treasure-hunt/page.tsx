"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import QRCode from "qrcode";

type Team = {
  eventParticipationId: number;
  teamName: string;
  currentClue: number;
  scannedClues: {
    clueId: number;
    scannedAt: string;
    clue: {
      clue: string;
    };
  }[];
  assignedClues?: {
    id: number;
    firstClue: { clue: string };
    secondClue: { clue: string };
    thirdClue: { clue: string };
    finalClue: { clue: string };
  };
  teamMembers: string[];
  isAttended?: boolean;
  hasScannedWinnerQr?: boolean;
  winnerScanTime?: string | null;
};

type CluePair = {
  id: number;
  firstClue: { clue: string; qrCode: string };
  secondClue: { clue: string; qrCode: string };
  thirdClue: { clue: string; qrCode: string };
  finalClue: { clue: string; qrCode: string };
};

const TreasureHuntAdmin = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [cluePairs, setCluePairs] = useState<CluePair[]>([]);
  const [isCreatingClues, setIsCreatingClues] = useState(false);
  const [winnerClue, setWinnerClue] = useState<{ id: number; clue: string; qrCode: string } | null>(null);
  const [newClues, setNewClues] = useState({
    firstClue: "",
    secondClue: "",
    thirdClue: "",
    finalClue: "",
  });
  const [isStopping, setIsStopping] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedPairId, setSelectedPairId] = useState<number | null>(null);
  const [_isGeneratingQR, _setIsGeneratingQR] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [editingPairId, setEditingPairId] = useState<number | null>(null);
  const [editClues, setEditClues] = useState({
    firstClue: "",
    secondClue: "",
    thirdClue: "",
    finalClue: "",
  });
  const [isCreatingCluePair, setIsCreatingCluePair] = useState(false);
  const [isUpdatingCluePair, setIsUpdatingCluePair] = useState(false);
  const [isCreatingWinnerClue, setIsCreatingWinnerClue] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingCluePairs, setIsLoadingCluePairs] = useState(false);
  const [isLoadingWinnerClue, setIsLoadingWinnerClue] = useState(false);
  const [isLoadingHuntStatus, setIsLoadingHuntStatus] = useState(false);
  const [isDownloadingWinnerQR, setIsDownloadingWinnerQR] = useState(false);
  const [isGeneratingQRMap, setIsGeneratingQRMap] = useState<{[key: number]: boolean}>({});
  const [huntStatus, setHuntStatus] = useState<'running' | 'stopped'>('stopped');
  const [isDeletingCluePair, setIsDeletingCluePair] = useState<{[key: number]: boolean}>({});
  const [isDeletingWinnerClue, setIsDeletingWinnerClue] = useState(false);

  const fetchTeams = async () => {
    try {
      setIsLoadingTeams(true);
      const response = await fetch("/api/events/treasure-hunt/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      toast.error("Failed to fetch teams");
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchCluePairs = async () => {
    try {
      setIsLoadingCluePairs(true);
      const response = await fetch("/api/events/treasure-hunt/clues");
      if (!response.ok) throw new Error("Failed to fetch clue pairs");
      const data = await response.json();
      setCluePairs(data);
    } catch (error) {
      toast.error("Failed to fetch clue pairs");
    } finally {
      setIsLoadingCluePairs(false);
    }
  };

  const createCluePair = async () => {
    try {
      setIsCreatingCluePair(true);
      const response = await fetch("/api/events/treasure-hunt/clues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstClue: newClues.firstClue,
          secondClue: newClues.secondClue,
          thirdClue: newClues.thirdClue,
          finalClue: newClues.finalClue,
        }),
      });

      if (!response.ok) throw new Error("Failed to create clue pair");

      toast.success("Clue pair created successfully");
      setIsCreatingClues(false);
      setNewClues({ firstClue: "", secondClue: "", thirdClue: "", finalClue: "" });
      fetchCluePairs();
    } catch (error) {
      toast.error("Failed to create clue pair");
    } finally {
      setIsCreatingCluePair(false);
    }
  };

  const startHunt = async () => {
    try {
      if (huntStatus === 'running') {
        toast.error("Hunt is already running");
        return;
      }
      setIsStarting(true);
      const response = await fetch("/api/events/treasure-hunt/start", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start hunt");
      }

      toast.success("Hunt started successfully!");
      await fetchHuntStatus(); // Refetch status to ensure correct state
      await fetchTeams(); // Refresh teams to show assignments
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start hunt");
    } finally {
      setIsStarting(false);
    }
  };

  const stopHunt = async () => {
    try {
      if (huntStatus === 'stopped') {
        toast.error("Hunt is already stopped");
        return;
      }
      setIsStopping(true);
      const response = await fetch("/api/events/treasure-hunt/stop", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to stop hunt");
      }

      toast.success("Hunt stopped successfully!");
      await fetchHuntStatus(); // Refetch status to ensure correct state
      await fetchTeams(); // Refresh teams to show updated state
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to stop hunt");
    } finally {
      setIsStopping(false);
    }
  };

  const generateQRCodes = async (pair: CluePair) => {
    try {
      setIsGeneratingQRMap(prev => ({ ...prev, [pair.id]: true }));
      const response = await fetch(`/api/events/treasure-hunt/clues/${pair.id}/qr`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate QR codes');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Use the blob to create a download
      saveAs(blob, `clue-pair-${pair.id}-qrcodes.zip`);
      
      toast.success("QR codes downloaded successfully!");
    } catch (_error) {
      toast.error("Failed to generate QR codes");
      console.error(_error);
    } finally {
      setIsGeneratingQRMap(prev => ({ ...prev, [pair.id]: false }));
    }
  };

  const updateCluePair = async (id: number) => {
    try {
      setIsUpdatingCluePair(true);
      const response = await fetch(`/api/events/treasure-hunt/clues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editClues),
      });

      if (!response.ok) throw new Error("Failed to update clue pair");

      toast.success("Clue pair updated successfully");
      setEditingPairId(null);
      setEditClues({ firstClue: "", secondClue: "", thirdClue: "", finalClue: "" });
      fetchCluePairs();
    } catch (error) {
      toast.error("Failed to update clue pair");
    } finally {
      setIsUpdatingCluePair(false);
    }
  };

  const startEditing = (pair: CluePair) => {
    setEditingPairId(pair.id);
    setEditClues({
      firstClue: pair.firstClue.clue,
      secondClue: pair.secondClue.clue,
      thirdClue: pair.thirdClue.clue,
      finalClue: pair.finalClue.clue,
    });
  };

  const fetchWinnerClue = async () => {
    try {
      setIsLoadingWinnerClue(true);
      const response = await fetch("/api/events/treasure-hunt/winner-clue");
      if (!response.ok) throw new Error("Failed to fetch winner clue");
      const data = await response.json();
      setWinnerClue(data);
    } catch (error) {
      console.error('Error fetching winner clue:', error);
      toast.error("Failed to fetch winner clue");
    } finally {
      setIsLoadingWinnerClue(false);
    }
  };

  const createWinnerClue = async (clue: string) => {
    try {
      setIsCreatingWinnerClue(true);
      const response = await fetch("/api/events/treasure-hunt/winner-clue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clue }),
      });

      if (!response.ok) throw new Error("Failed to create winner clue");

      toast.success("Winner clue created successfully");
      fetchWinnerClue();
      setNewClues(prev => ({ ...prev, firstClue: "" }));
    } catch (error) {
      toast.error("Failed to create winner clue");
    } finally {
      setIsCreatingWinnerClue(false);
    }
  };

  const deleteCluePair = async (id: number) => {
    try {
      setIsDeletingCluePair(prev => ({ ...prev, [id]: true }));
      const response = await fetch(`/api/events/treasure-hunt/clues/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error("Failed to delete clue pair");
      }

      toast.success("Clue pair deleted successfully");
      fetchCluePairs();
    } catch (error) {
      toast.error("Failed to delete clue pair");
    } finally {
      setIsDeletingCluePair(prev => ({ ...prev, [id]: false }));
    }
  };

  const deleteWinnerClue = async () => {
    try {
      setIsDeletingWinnerClue(true);
      const response = await fetch("/api/events/treasure-hunt/winner-clue", {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error("Failed to delete winner clue");
      }

      toast.success("Winner clue deleted successfully");
      setWinnerClue(null);
    } catch (error) {
      toast.error("Failed to delete winner clue");
    } finally {
      setIsDeletingWinnerClue(false);
    }
  };

  const fetchHuntStatus = async () => {
    try {
      setIsLoadingHuntStatus(true);
      const response = await fetch("/api/events/treasure-hunt/status");
      if (!response.ok) throw new Error("Failed to fetch hunt status");
      const data = await response.json();
      setHuntStatus(data.status);
    } catch (error) {
      console.error('Error fetching hunt status:', error);
      // Default to stopped state if there's an error
      setHuntStatus('stopped');
    } finally {
      setIsLoadingHuntStatus(false);
    }
  };

  const downloadWinnerQR = async () => {
    try {
      setIsDownloadingWinnerQR(true);
      const response = await fetch('/api/events/treasure-hunt/winner-clue/qr');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download QR code');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Use the blob to create a download
      saveAs(blob, `winner-clue-qr.png`);
      
      toast.success("QR code downloaded successfully!");
    } catch (_error) {
      toast.error("Failed to download QR code");
      console.error(_error);
    } finally {
      setIsDownloadingWinnerQR(false);
    }
  };

  const QRCodeDisplay = ({ qrCode, label }: { qrCode: string; label: string }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
      if (canvasRef.current && qrCode) {
        QRCode.toCanvas(canvasRef.current, qrCode, {
          width: 120,
          margin: 2,
        }).catch(error => {
          console.error("Error generating QR code:", error);
        });
      }
    }, [qrCode]);

    return (
      <div className="flex flex-col items-center p-3 bg-neutral-800 rounded-lg">
        <p className="mb-2 text-sm font-medium">{label}</p>
        <div className="w-full max-w-[150px] h-auto aspect-square bg-white p-2 rounded-lg flex items-center justify-center">
          <canvas ref={canvasRef} />
        </div>
        <p className="mt-2 text-xs text-neutral-400 break-all text-center max-w-full truncate">{qrCode}</p>
      </div>
    );
  };

  const TeamDetailsModal = ({ team }: { team: Team }) => {
    if (!team) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-800 rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold">Team Details - {team.teamName}</h3>
            <button
              onClick={() => setSelectedTeamId(null)}
              className="text-neutral-400 hover:text-white p-2"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Team Members</h4>
              <p className="text-neutral-400 text-sm sm:text-base">{team.teamMembers.join(", ")}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Clue Scan Timeline</h4>
              <div className="space-y-2">
                {team.scannedClues.length > 0 ? (
                  team.scannedClues.map((scan, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-3 ${scan.clueId === -1 ? 'bg-indigo-900/70 border border-indigo-500/50' : 'bg-neutral-700'}`}
                    >
                      <p className="text-sm font-medium">
                        {scan.clueId === -1 ? (
                          <span className="text-indigo-200">🏆 Winner QR</span>
                        ) : (
                          <span>Clue {idx + 1}</span>
                        )}
                        : {scan.clue.clue}
                      </p>
                      <p className="text-xs sm:text-sm text-neutral-400">
                        Scanned at: {new Date(scan.scannedAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-400">No clues scanned yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchTeams();
    fetchCluePairs();
    fetchWinnerClue();
    fetchHuntStatus();
  }, []);

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Treasure Hunt Management</h1>
        <p className="text-sm sm:text-base text-neutral-400">
          Manage teams, clues, and track progress for the treasure hunt.
        </p>
      </div>

      {(isLoadingTeams || isLoadingCluePairs || isLoadingWinnerClue || isLoadingHuntStatus) && (
        <div className="flex justify-center items-center p-6 bg-neutral-800 rounded-xl mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading data...</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6">
        {/* Hunt Controls Section */}
        <div className="bg-neutral-800 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Hunt Controls</h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Start or stop the hunt. Starting will assign clue pairs to teams with marked attendance.
                {huntStatus === 'running' && (
                  <span className="ml-2 text-green-400">Hunt is currently running</span>
                )}
                {huntStatus === 'stopped' && (
                  <span className="ml-2 text-neutral-400">Hunt is currently stopped</span>
                )}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={startHunt}
                disabled={isStarting || isStopping || huntStatus === 'running' || isLoadingHuntStatus}
                className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-md transition-colors ${
                  isStarting || huntStatus === 'running' || isLoadingHuntStatus
                    ? "bg-neutral-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isStarting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Starting...
                  </span>
                ) : "Start Hunt"}
              </button>
              <button
                onClick={stopHunt}
                disabled={isStarting || isStopping || huntStatus === 'stopped' || isLoadingHuntStatus}
                className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-md transition-colors ${
                  isStopping || huntStatus === 'stopped' || isLoadingHuntStatus
                    ? "bg-neutral-600 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isStopping ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Stopping...
                  </span>
                ) : "Stop Hunt"}
              </button>
            </div>
          </div>
        </div>

        {/* Clue Pairs Section */}
        <div className="bg-neutral-800 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold">Clue Pairs</h2>
            {isLoadingCluePairs && (
              <p className="text-neutral-400 text-sm sm:text-xs italic">Loading clue pairs...</p>
            )}
            <button
              onClick={() => setIsCreatingClues(!isCreatingClues)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              {isCreatingClues ? "Cancel" : "Create New Clues"}
            </button>
          </div>

          {isCreatingClues && (
            <div className="bg-neutral-700 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-4">Create New Clues</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">First Clue</label>
                  <input
                    type="text"
                    value={newClues.firstClue}
                    onChange={(e) => setNewClues(prev => ({ ...prev, firstClue: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-md"
                    placeholder="Enter first clue"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Second Clue</label>
                  <input
                    type="text"
                    value={newClues.secondClue}
                    onChange={(e) => setNewClues(prev => ({ ...prev, secondClue: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-md"
                    placeholder="Enter second clue"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Third Clue</label>
                  <input
                    type="text"
                    value={newClues.thirdClue}
                    onChange={(e) => setNewClues(prev => ({ ...prev, thirdClue: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-md"
                    placeholder="Enter third clue"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Final Clue</label>
                  <input
                    type="text"
                    value={newClues.finalClue}
                    onChange={(e) => setNewClues(prev => ({ ...prev, finalClue: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-md"
                    placeholder="Enter final clue"
                  />
                </div>
                <button
                  onClick={createCluePair}
                  disabled={isCreatingCluePair}
                  className={`w-full px-4 py-2 rounded-md transition-colors ${
                    isCreatingCluePair 
                      ? "bg-neutral-600 cursor-not-allowed" 
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isCreatingCluePair ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Creating...
                    </span>
                  ) : "Create Clues"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {cluePairs.map((pair) => (
              <div key={pair.id} className="bg-neutral-700 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="font-semibold">Clue Pair #{pair.id}</h3>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => startEditing(pair)}
                      className="flex-1 sm:flex-none px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setSelectedPairId(selectedPairId === pair.id ? null : pair.id)}
                      className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-sm"
                    >
                      {selectedPairId === pair.id ? "Hide QR" : "Show QR"}
                    </button>
                    <button
                      onClick={() => generateQRCodes(pair)}
                      disabled={isGeneratingQRMap[pair.id]}
                      className={`flex-1 sm:flex-none px-3 py-2 rounded-md transition-colors text-sm ${
                        isGeneratingQRMap[pair.id]
                          ? "bg-neutral-600 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {isGeneratingQRMap[pair.id] ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Downloading...
                        </span>
                      ) : (
                        "Download"
                      )}
                    </button>
                    <button
                      onClick={() => deleteCluePair(pair.id)}
                      disabled={isDeletingCluePair[pair.id]}
                      className={`flex-1 sm:flex-none px-3 py-2 rounded-md transition-colors text-sm ${
                        isDeletingCluePair[pair.id]
                          ? "bg-neutral-600 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {isDeletingCluePair[pair.id] ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Deleting...
                        </span>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </div>

                {editingPairId === pair.id ? (
                  <div className="bg-neutral-800 rounded-lg p-4 mb-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm mb-2">First Clue</label>
                        <input
                          type="text"
                          value={editClues.firstClue}
                          onChange={(e) => setEditClues(prev => ({ ...prev, firstClue: e.target.value }))}
                          className="w-full px-3 py-2 bg-neutral-700 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Second Clue</label>
                        <input
                          type="text"
                          value={editClues.secondClue}
                          onChange={(e) => setEditClues(prev => ({ ...prev, secondClue: e.target.value }))}
                          className="w-full px-3 py-2 bg-neutral-700 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Third Clue</label>
                        <input
                          type="text"
                          value={editClues.thirdClue}
                          onChange={(e) => setEditClues(prev => ({ ...prev, thirdClue: e.target.value }))}
                          className="w-full px-3 py-2 bg-neutral-700 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Final Clue</label>
                        <input
                          type="text"
                          value={editClues.finalClue}
                          onChange={(e) => setEditClues(prev => ({ ...prev, finalClue: e.target.value }))}
                          className="w-full px-3 py-2 bg-neutral-700 rounded-md"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => updateCluePair(pair.id)}
                          disabled={isUpdatingCluePair}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            isUpdatingCluePair 
                              ? "bg-neutral-600 cursor-not-allowed" 
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {isUpdatingCluePair ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Saving...
                            </span>
                          ) : "Save Changes"}
                        </button>
                        <button
                          onClick={() => setEditingPairId(null)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                          disabled={isUpdatingCluePair}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-400">First Clue</p>
                      <p className="text-sm sm:text-base break-words">{pair.firstClue.clue}</p>
                      <p className="text-xs text-neutral-500 mt-1 truncate">{pair.firstClue.qrCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Second Clue</p>
                      <p className="text-sm sm:text-base break-words">{pair.secondClue.clue}</p>
                      <p className="text-xs text-neutral-500 mt-1 truncate">{pair.secondClue.qrCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Third Clue</p>
                      <p className="text-sm sm:text-base break-words">{pair.thirdClue.clue}</p>
                      <p className="text-xs text-neutral-500 mt-1 truncate">{pair.thirdClue.qrCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">Final Clue</p>
                      <p className="text-sm sm:text-base break-words">{pair.finalClue.clue}</p>
                      <p className="text-xs text-neutral-500 mt-1 truncate">{pair.finalClue.qrCode}</p>
                    </div>
                  </div>
                )}

                {/* QR Code Display Section - Improved for mobile */}
                {selectedPairId === pair.id && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-4">QR Codes</h4>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3">
                      <QRCodeDisplay qrCode={pair.firstClue.qrCode} label="First Clue QR" />
                      <QRCodeDisplay qrCode={pair.secondClue.qrCode} label="Second Clue QR" />
                      <QRCodeDisplay qrCode={pair.thirdClue.qrCode} label="Third Clue QR" />
                      <QRCodeDisplay qrCode={pair.finalClue.qrCode} label="Final Clue QR" />
                    </div>
                  </div>
                )}
              </div>
            ))}

          {isLoadingCluePairs && (
              <p className="text-neutral-400 text-sm sm:text-xs italic">Loading clue pairs...</p>
            )}
          </div>
        </div>

        {/* Winner Clue Section */}
        <div className="bg-neutral-800 rounded-xl p-4 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="w-full sm:w-auto">
              <h2 className="text-lg sm:text-xl font-bold">Winner Clue</h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Create or manage the final common clue that teams need to find to win the hunt
              </p>
            </div>
            {winnerClue && (
              <button
                onClick={deleteWinnerClue}
                disabled={isDeletingWinnerClue}
                className={`w-full sm:w-auto px-3 py-2 rounded-md transition-colors text-sm ${
                  isDeletingWinnerClue
                    ? "bg-neutral-600 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isDeletingWinnerClue ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Deleting...
                  </span>
                ) : "Delete Winner Clue"}
              </button>
            )}
          </div>

          {winnerClue ? (
            <div className="bg-neutral-700 rounded-lg p-3 sm:p-4">
              <div className="mb-4">
                <p className="text-sm text-neutral-400">Current Winner Clue</p>
                <p className="text-sm sm:text-base mt-1 break-words">{winnerClue.clue}</p>
                <p className="text-xs text-neutral-500 mt-2 break-all overflow-hidden">{winnerClue.qrCode}</p>
              </div>
              <div className="mt-4 flex flex-col items-center sm:items-start">
                <div className="w-full max-w-[200px] sm:max-w-[250px]">
                  <QRCodeDisplay qrCode={winnerClue.qrCode} label="Winner QR Code" />
                </div>
              </div>

              <button
                onClick={downloadWinnerQR}
                disabled={isDownloadingWinnerQR}
                className={`mt-4 w-full sm:w-auto px-4 py-2 rounded-md text-sm transition-colors ${
                  isDownloadingWinnerQR 
                    ? "bg-neutral-600 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isDownloadingWinnerQR ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Downloading...
                  </span>
                ) : "Download QR Code"}
              </button>
            </div>
          ) : (
            <div className="bg-neutral-700 rounded-lg p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm mb-1 sm:mb-2">Winner Clue Text</label>
                  <input
                    type="text"
                    value={newClues.firstClue}
                    onChange={(e) => setNewClues(prev => ({ ...prev, firstClue: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-md text-sm sm:text-base"
                    placeholder="Enter the winner clue text"
                  />
                </div>
                <button
                  onClick={() => createWinnerClue(newClues.firstClue)}
                  disabled={isCreatingWinnerClue || !newClues.firstClue.trim()}
                  className={`w-full sm:w-auto px-4 py-2 rounded-md transition-colors text-sm sm:text-base ${
                    isCreatingWinnerClue || !newClues.firstClue.trim()
                      ? "bg-neutral-600 cursor-not-allowed" 
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isCreatingWinnerClue ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Creating...
                    </span>
                  ) : "Create Winner Clue"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Teams Progress Section */}
        <div className="bg-neutral-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Teams Progress</h2>
          {isLoadingTeams ? (
            <div className="flex justify-center items-center p-6">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading teams...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.length > 0 ? teams.map((team) => (
                <div
                  key={team.eventParticipationId}
                  className={`rounded-lg p-4 ${
                    team.hasScannedWinnerQr 
                      ? 'bg-gradient-to-r from-indigo-900/30 to-neutral-700 border border-indigo-500/30' 
                      : 'bg-neutral-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{team.teamName}</h3>
                        {!team.isAttended && (
                          <span className="text-xs px-2 py-1 bg-yellow-600/30 text-yellow-200 rounded-full">
                            Not attended
                          </span>
                        )}
                        {team.hasScannedWinnerQr && (
                          <span className="text-xs px-2 py-1 bg-indigo-600/50 text-indigo-200 rounded-full flex items-center">
                            <span className="mr-1">🏆</span> Winner!
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-400 mt-1 break-words">
                        Team Members: {team.teamMembers.join(", ")}
                      </p>
                      {team.hasScannedWinnerQr && team.winnerScanTime && (
                        <p className="text-xs text-indigo-300 mt-1">
                          Completed hunt on: {new Date(team.winnerScanTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <span className={`text-xs sm:text-sm px-2 py-1 rounded ${
                        team.currentClue === 5 
                          ? 'bg-indigo-900/70 text-indigo-200' 
                          : 'bg-blue-900'
                      }`}>
                        {team.currentClue === 5 ? 'Completed' : `Clue ${team.currentClue}/4`}
                      </span>
                      <button
                        onClick={() => setSelectedTeamId(team.eventParticipationId)}
                        className="flex-1 sm:flex-none px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  {/* Assigned Clues */}
                  {team.assignedClues && (
                    <div className="mt-2 p-3 bg-neutral-800 rounded-lg">
                      <p className="text-xs sm:text-sm text-neutral-400 mb-2">Assigned Clues:</p>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <p className="break-words">1. {team.assignedClues.firstClue.clue}</p>
                        <p className="break-words">2. {team.assignedClues.secondClue.clue}</p>
                        <p className="break-words">3. {team.assignedClues.thirdClue.clue}</p>
                        <p className="break-words">4. {team.assignedClues.finalClue.clue}</p>
                      </div>
                    </div>
                  )}

                  {/* Scanned Clues History */}
                  <div className="mt-3 space-y-2">
                    {team.scannedClues.length > 0 ? (
                      team.scannedClues.map((scan, idx) => (
                        <div
                          key={idx}
                          className={`text-xs sm:text-sm p-2 rounded ${
                            scan.clueId === -1 
                              ? 'bg-indigo-900/50 text-indigo-200' 
                              : 'text-neutral-400'
                          }`}
                        >
                          {scan.clueId === -1 ? '🏆 ' : ''}{new Date(scan.scannedAt).toLocaleString()} - {scan.clue.clue}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs sm:text-sm text-neutral-500">No clues scanned yet</p>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-neutral-400 p-4">No teams found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedTeamId && (
        <TeamDetailsModal 
          team={teams.find(t => t.eventParticipationId === selectedTeamId)!}
        />
      )}
    </div>
  );
};

export default TreasureHuntAdmin;
