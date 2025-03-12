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
  isAttended?: boolean; // Add this field
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
  const [isGeneratingQRMap, setIsGeneratingQRMap] = useState<{[key: number]: boolean}>({});
  const [huntStatus, setHuntStatus] = useState<'running' | 'stopped'>('stopped');

  // ... existing fetch and CRUD functions ...
  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/events/treasure-hunt/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      toast.error("Failed to fetch teams");
    }
  };

  const fetchCluePairs = async () => {
    try {
      const response = await fetch("/api/events/treasure-hunt/clues");
      if (!response.ok) throw new Error("Failed to fetch clue pairs");
      const data = await response.json();
      setCluePairs(data);
    } catch (error) {
      toast.error("Failed to fetch clue pairs");
    }
  };

  const createCluePair = async () => {
    try {
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
    }
  };

  const startHunt = async () => {
    try {
      setIsStarting(true);
      const response = await fetch("/api/events/treasure-hunt/start", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start hunt");
      }

      toast.success("Hunt started successfully!");
      setHuntStatus('running');
      fetchTeams(); // Refresh teams to show assignments
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start hunt");
    } finally {
      setIsStarting(false);
    }
  };

  const stopHunt = async () => {
    try {
      setIsStopping(true);
      const response = await fetch("/api/events/treasure-hunt/stop", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to stop hunt");
      }

      toast.success("Hunt stopped successfully!");
      setHuntStatus('stopped');
      fetchTeams(); // Refresh teams to show updated state
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

  // Add fetchWinnerClue function
  const fetchWinnerClue = async () => {
    try {
      const response = await fetch("/api/events/treasure-hunt/winner-clue");
      if (!response.ok) throw new Error("Failed to fetch winner clue");
      const data = await response.json();
      setWinnerClue(data);
    } catch (error) {
      console.error('Error fetching winner clue:', error);
      toast.error("Failed to fetch winner clue");
    }
  };

  // Add createWinnerClue function
  const createWinnerClue = async (clue: string) => {
    try {
      const response = await fetch("/api/events/treasure-hunt/winner-clue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clue }),
      });

      if (!response.ok) throw new Error("Failed to create winner clue");

      toast.success("Winner clue created successfully");
      fetchWinnerClue();
    } catch (error) {
      toast.error("Failed to create winner clue");
    }
  };

  // Add fetchHuntStatus
  const fetchHuntStatus = async () => {
    try {
      const response = await fetch("/api/events/treasure-hunt/status");
      if (!response.ok) throw new Error("Failed to fetch hunt status");
      const data = await response.json();
      setHuntStatus(data.status);
    } catch (error) {
      console.error('Error fetching hunt status:', error);
    }
  };

  // Add downloadWinnerQR function
  const downloadWinnerQR = async () => {
    try {
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
    }
  };

  // QRCodeDisplay component with responsive adjustments
  const QRCodeDisplay = ({ qrCode, label }: { qrCode: string; label: string }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, qrCode, {
          width: 120,  // Slightly smaller for better mobile display
          margin: 2,
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

  // Make TeamDetailsModal more responsive
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
                      className="bg-neutral-700 rounded-lg p-3"
                    >
                      <p className="text-sm font-medium">
                        Clue {idx + 1}: {scan.clue.clue}
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

  // Simplify the QR code useEffect - we don't need complex DOM manipulation
  useEffect(() => {
    // No need for additional effects - QRCodeDisplay component handles rendering
  }, [selectedPairId, cluePairs]);

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Treasure Hunt Management</h1>
        <p className="text-sm sm:text-base text-neutral-400">
          Manage teams, clues, and track progress for the treasure hunt.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Hunt Controls Section */}
        <div className="bg-neutral-800 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Hunt Controls</h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Start or stop the hunt. Starting will assign clue pairs to teams with marked attendance.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={startHunt}
                disabled={isStarting || isStopping || huntStatus === 'running'}
                className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-md transition-colors ${
                  isStarting || huntStatus === 'running'
                    ? "bg-neutral-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isStarting ? "Starting..." : "Start Hunt"}
              </button>
              <button
                onClick={stopHunt}
                disabled={isStarting || isStopping || huntStatus === 'stopped'}
                className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 rounded-md transition-colors ${
                  isStopping || huntStatus === 'stopped'
                    ? "bg-neutral-600 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isStopping ? "Stopping..." : "Stop Hunt"}
              </button>
            </div>
          </div>
        </div>

        {/* Clue Pairs Section */}
        <div className="bg-neutral-800 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold">Clue Pairs</h2>
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
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  Create Clues
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
                      {isGeneratingQRMap[pair.id] ? "Downloading..." : "Download"}
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
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingPairId(null)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
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
          </div>
        </div>

        {/* Winner Clue Section */}
        <div className="bg-neutral-800 rounded-xl p-4 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Winner Clue</h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Create or manage the final common clue that teams need to find to win the hunt
              </p>
            </div>
          </div>

          {winnerClue ? (
            <div className="bg-neutral-700 rounded-lg p-4">
              <div className="mb-4">
                <p className="text-sm text-neutral-400">Current Winner Clue</p>
                <p className="text-base mt-1">{winnerClue.clue}</p>
                <p className="text-xs text-neutral-500 mt-2 break-all">{winnerClue.qrCode}</p>
              </div>
              
              <div className="mt-4">
                <QRCodeDisplay qrCode={winnerClue.qrCode} label="Winner QR Code" />
              </div>

              <button
                onClick={downloadWinnerQR}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors"
              >
                Download QR Code
              </button>
            </div>
          ) : (
            <div className="bg-neutral-700 rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Winner Clue Text</label>
                  <input
                    type="text"
                    value={newClues.firstClue}
                    onChange={(e) => setNewClues(prev => ({ ...prev, firstClue: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800 rounded-md"
                    placeholder="Enter the winner clue text"
                  />
                </div>
                <button
                  onClick={() => createWinnerClue(newClues.firstClue)}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  Create Winner Clue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Teams Progress Section */}
        <div className="bg-neutral-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Teams Progress</h2>
          <div className="space-y-4">
            {teams.map((team) => (
              <div
                key={team.eventParticipationId}
                className="bg-neutral-700 rounded-lg p-4"
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
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-1 break-words">
                      Team Members: {team.teamMembers.join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <span className="text-xs sm:text-sm px-2 py-1 bg-blue-900 rounded">
                      Clue {team.currentClue}/4
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
                  {team.scannedClues.map((scan, idx) => (
                    <div
                      key={idx}
                      className="text-xs sm:text-sm text-neutral-400"
                    >
                      {new Date(scan.scannedAt).toLocaleString()} - {scan.clue.clue}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
