import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaIdCard,
  FaCamera,
  FaCheck,
  FaTimes as FaCancel,
  FaEdit
} from "react-icons/fa";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userInfo: {
    name: string;
    email: string;
    phone: string;
    college: string;
    sic: string;
    year: string;
    imageUrl: string;
    eventParticipation: number;
  };
}

const UserProfileModal = ({
  isOpen,
  onClose,
  userInfo: initialUserInfo
}: UserProfileModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState(initialUserInfo);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when props change
  useEffect(() => {
    setUserInfo(initialUserInfo);
  }, [initialUserInfo]);

  if (!isOpen) return null;

  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling edit, reset to original data
      setUserInfo(initialUserInfo);
      setImagePreview(null);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Only send the update if we have a userId
      const response = await fetch(`/api/user/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          sic: userInfo.sic,
          year: userInfo.year
          // Add profile image update logic if needed
        }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Update was successful
      setIsEditing(false);
      // You might want to trigger a refresh of the parent component data
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
        onClick={isEditing ? undefined : onClose}
      />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30rem] bg-neutral-800 rounded-xl shadow-lg z-50 overflow-hidden">
        <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {isEditing ? "Edit Profile" : "User Profile"}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={handleEditToggle}
                  className="hover:bg-neutral-700 p-2 rounded-full flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  <FaEdit />
                  <span className="text-sm">Edit</span>
                </button>
                <button
                  onClick={onClose}
                  className="hover:bg-neutral-700 p-2 rounded-full"
                >
                  <FaTimes />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveChanges}
                  className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-lg transition-colors flex items-center gap-1 text-sm"
                >
                  <FaCheck /> Save
                </button>
                <button
                  onClick={handleEditToggle}
                  className="bg-neutral-600 hover:bg-neutral-700 text-white py-1 px-3 rounded-lg transition-colors flex items-center gap-1 text-sm"
                >
                  <FaCancel /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div
              className={`relative w-24 h-24 mb-3 ${
                isEditing ? "cursor-pointer group" : ""
              }`}
              onClick={handleImageClick}
            >
              <Image
                src={
                  imagePreview ||
                  userInfo.imageUrl ||
                  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"
                }
                alt="Profile"
                fill
                className="rounded-full object-cover border-2 border-blue-500"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaCamera className="text-white text-xl" />
                </div>
              )}
              {isEditing && (
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              )}
            </div>

            {isEditing ? (
              <input
                type="text"
                name="name"
                value={userInfo?.name || ""}
                onChange={handleInputChange}
                className="text-xl font-bold bg-neutral-700 bg-opacity-40 rounded px-3 py-1 text-center"
              />
            ) : (
              <h3 className="text-xl font-bold">{userInfo?.name || "User"}</h3>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-700 bg-opacity-40">
              <FaEnvelope className="text-blue-400 text-lg" />
              <div className="w-full">
                <p className="text-sm text-neutral-400">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={userInfo?.email || ""}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-600 rounded px-2 py-1"
                  />
                ) : (
                  <p>{userInfo?.email || "No email provided"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-700 bg-opacity-40">
              <FaPhone className="text-blue-400 text-lg" />
              <div className="w-full">
                <p className="text-sm text-neutral-400">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={userInfo?.phone || ""}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-600 rounded px-2 py-1"
                  />
                ) : (
                  <p>{userInfo?.phone || "No phone provided"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-700 bg-opacity-40">
              <FaGraduationCap className="text-blue-400 text-lg" />
              <div className="w-full">
                <p className="text-sm text-neutral-400">College</p>
                <p>{userInfo?.college || "No college information"}</p>
                {isEditing && (
                  <p className="text-xs text-neutral-400 mt-1">
                    (College information cannot be changed)
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-700 bg-opacity-40 flex-1">
                <FaIdCard className="text-blue-400 text-lg" />
                <div className="w-full">
                  <p className="text-sm text-neutral-400">SIC</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="sic"
                      value={userInfo?.sic || ""}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-600 rounded px-2 py-1"
                    />
                  ) : (
                    <p>{userInfo?.sic || "No SIC provided"}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-700 bg-opacity-40 flex-1">
                <FaIdCard className="text-blue-400 text-lg" />
                <div className="w-full">
                  <p className="text-sm text-neutral-400">Year</p>
                  {isEditing ? (
                    <select
                      name="year"
                      value={userInfo?.year || ""}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-600 rounded px-2 py-1"
                    >
                      <option value="">Select year</option>
                      <option value="1st year">1st year</option>
                      <option value="2nd year">2nd year</option>
                      <option value="3rd year">3rd year</option>
                      <option value="4th year">4th year</option>
                    </select>
                  ) : (
                    <p>{userInfo?.year || "Not specified"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Only show event participation when not in edit mode */}
          {!isEditing && (
            <div className="mt-6 p-4 bg-blue-500 bg-opacity-20 rounded-lg">
              <h4 className="font-semibold flex items-center gap-2">
                <FaUser className="text-blue-400" />
                Event Participation
              </h4>
              <p className="mt-2">
                Registered for{" "}
                <span className="font-bold">
                  {userInfo?.eventParticipation || 0}
                </span>{" "}
                events
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserProfileModal;
