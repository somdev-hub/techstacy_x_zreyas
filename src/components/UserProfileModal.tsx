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
  FaEdit,
  FaChevronDown,
} from "react-icons/fa";
import { Events, Year } from "@prisma/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userFormSchema, type UserFormData } from "@/lib/schemas";
import { toast } from "sonner";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userInfo: {
    id?: number;
    name: string;
    email: string;
    phone: string;
    college: string;
    sic: string;
    year: string;
    imageUrl: string;
    role: string;
    eventParticipation?: { eventId: number; name: string }[]; // Updated to include event name
    eventHeads?: { eventId: number; name: string }[]; // Added for admin event heads
    password?: string;
  };
}

const UserProfileModal = ({
  isOpen,
  onClose,
  userInfo: initialUserInfo,
}: UserProfileModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initialUserInfo.name,
      email: initialUserInfo.email,
      phone: initialUserInfo.phone,
      sic: initialUserInfo.sic,
      year: initialUserInfo.year as Year,
      managedEvents: initialUserInfo.eventHeads?.map((eh) => eh.name) || [],
    },
  });

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsEventDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update local state when props change
  useEffect(() => {
    reset({
      name: initialUserInfo.name,
      email: initialUserInfo.email,
      phone: initialUserInfo.phone,
      sic: initialUserInfo.sic,
      year: initialUserInfo.year as Year,
      managedEvents: initialUserInfo.eventHeads?.map((eh) => eh.name) || [],
    });
    // Initialize selected events from userInfo
    if (initialUserInfo.eventHeads) {
      setSelectedEvents(initialUserInfo.eventHeads.map((eh) => eh.name));
    }
  }, [initialUserInfo, reset]);

  if (!isOpen) return null;

  const handleEditToggle = () => {
    if (isEditing) {
      reset();
      setImagePreview(null);
    }
    setIsEditing(!isEditing);
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

  const handleEventAdd = (eventName: string) => {
    if (!selectedEvents.includes(eventName)) {
      setSelectedEvents((prev) => [...prev, eventName]);
    }
    setIsEventDropdownOpen(false);
  };

  const handleEventRemove = (eventName: string) => {
    setSelectedEvents((prev) => prev.filter((e) => e !== eventName));
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      const response = await fetch(`/api/users/${initialUserInfo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          imageUrl: imagePreview || initialUserInfo.imageUrl,
          managedEvents: selectedEvents,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();
      setIsEditing(false);
      reset(updatedUser);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={isEditing ? undefined : onClose}
      />
      <div className=" fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] sm:w-[80%] md:w-[35rem] bg-neutral-800 rounded-xl shadow-lg z-50 flex flex-col max-h-[85vh]">
        {/* Fixed Header */}
        <div className="p-3 sm:p-4 border-b border-neutral-700 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold">
            {isEditing ? "Edit Profile" : "User Profile"}
          </h2>
          <div className="flex items-center gap-1 sm:gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={handleEditToggle}
                  className="hover:bg-neutral-700 p-1.5 sm:p-2 rounded-full flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  <FaEdit />
                  <span className="hidden sm:inline text-sm">Edit</span>
                </button>
                <button
                  onClick={onClose}
                  className="hover:bg-neutral-700 p-1.5 sm:p-2 rounded-full"
                >
                  <FaTimes />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSubmit(onSubmit)}
                  className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 sm:px-3 rounded-lg transition-colors flex items-center gap-1 text-sm"
                >
                  <FaCheck />
                  <span className="hidden sm:inline">Save</span>
                </button>
                <button
                  onClick={handleEditToggle}
                  className="bg-neutral-600 hover:bg-neutral-700 text-white py-1 px-2 sm:px-3 rounded-lg transition-colors flex items-center gap-1 text-sm"
                >
                  <FaCancel />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto no-visible-scrollbar flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            {/* Profile Image and Name */}
            <div className="flex flex-col items-center space-y-3">
              <div
                className={`relative w-20 h-20 ${
                  isEditing ? "cursor-pointer group" : ""
                }`}
                onClick={handleImageClick}
              >
                <Image
                  src={
                    imagePreview ||
                    initialUserInfo.imageUrl ||
                    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"
                  }
                  alt="Profile"
                  fill
                  className="rounded-full object-cover border-2 border-blue-500"
                />
                {isEditing && (
                  <>
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaCamera className="text-white text-xl" />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </>
                )}
              </div>

              {isEditing ? (
                <div>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="text-xl font-bold bg-neutral-700 bg-opacity-40 rounded px-3 py-1 text-center"
                      />
                    )}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              ) : (
                <h3 className="text-xl font-bold">
                  {initialUserInfo?.name || "User"}
                </h3>
              )}
            </div>

            {/* User Details Grid */}
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40">
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-blue-400 text-lg flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-neutral-400">Email</p>
                    {isEditing ? (
                      <div>
                        <Controller
                          name="email"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="email"
                              className="w-full bg-neutral-600 rounded px-2 py-1 mt-1"
                            />
                          )}
                        />
                        {errors.email && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="truncate">
                        {initialUserInfo?.email || "No email provided"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40">
                <div className="flex items-center gap-2">
                  <FaPhone className="text-blue-400 text-lg flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-neutral-400">Phone</p>
                    {isEditing ? (
                      <div>
                        <Controller
                          name="phone"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="tel"
                              className="w-full bg-neutral-600 rounded px-2 py-1 mt-1"
                            />
                          )}
                        />
                        {errors.phone && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p>{initialUserInfo?.phone || "No phone provided"}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 w-full">
                <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40 flex-1">
                  <div className="flex items-center gap-2">
                    <FaIdCard className="text-blue-400 text-lg flex-shrink-0" />
                    <div className="w-full">
                      <p className="text-sm text-neutral-400">SIC</p>
                      {isEditing ? (
                        <div>
                          <Controller
                            name="sic"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="text"
                                className="w-full bg-neutral-600 rounded px-2 py-1 mt-1"
                              />
                            )}
                          />
                          {errors.sic && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.sic.message}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p>{initialUserInfo?.sic || "No SIC provided"}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40 flex-1">
                  <div className="flex items-center gap-2">
                    <FaGraduationCap className="text-blue-400 text-lg flex-shrink-0" />
                    <div className="w-full">
                      <p className="text-sm text-neutral-400">Year</p>
                      {isEditing ? (
                        <div>
                          <Controller
                            name="year"
                            control={control}
                            render={({ field }) => (
                              <select
                                {...field}
                                className="w-full bg-neutral-600 rounded px-2 py-1 mt-1"
                              >
                                <option value="">Select year</option>
                                <option value="FIRST_YEAR">1st year</option>
                                <option value="SECOND_YEAR">2nd year</option>
                                <option value="THIRD_YEAR">3rd year</option>
                                <option value="FOURTH_YEAR">4th year</option>
                              </select>
                            )}
                          />
                          {errors.year && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.year.message}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p>
                          {initialUserInfo?.year
                            ?.replace("_", " ")
                            ?.toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* College Info */}
            <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40">
              <div className="flex items-center gap-2">
                <FaGraduationCap className="text-blue-400 text-lg flex-shrink-0" />
                <div className="w-full">
                  <p className="text-sm text-neutral-400">College</p>
                  <p className="truncate">
                    {initialUserInfo?.college || "No college information"}
                  </p>
                  {isEditing && (
                    <p className="text-xs text-neutral-400 mt-1">
                      (College information cannot be changed)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Password Field - Only show when editing */}
            {isEditing && (
              <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40">
                <div className="flex items-center gap-2">
                  <FaIdCard className="text-blue-400 text-lg flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-neutral-400">New Password</p>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <input
                            {...field}
                            type="password"
                            placeholder="Enter new password"
                            className="w-full bg-neutral-600 rounded px-2 py-1 mt-1"
                          />
                          {errors.password && (
                            <p className="text-red-400 text-xs mt-1">
                              {errors.password.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                    <p className="text-xs text-neutral-400 mt-1">
                      Leave empty to keep current password
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Event Management - Show when editing admin users */}
            {isEditing && initialUserInfo.role === "ADMIN" && (
              <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FaUser className="text-blue-400" />
                    Manage Events
                  </h4>

                  {/* Selected Events Chips */}
                  <div className="flex flex-wrap gap-2">
                    {selectedEvents.map((eventName) => (
                      <div
                        key={eventName}
                        className="bg-blue-500 bg-opacity-20 text-sm rounded-full px-3 py-1 flex items-center gap-2"
                      >
                        <span>{eventName.replace(/_/g, " ")}</span>
                        <button
                          onClick={() => handleEventRemove(eventName)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Event Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() =>
                        setIsEventDropdownOpen(!isEventDropdownOpen)
                      }
                      className="w-full bg-neutral-600 rounded-lg p-2 flex justify-between items-center hover:bg-neutral-500 transition-colors"
                    >
                      <span className="text-sm text-neutral-300">
                        Add events to manage
                      </span>
                      <FaChevronDown
                        className={`transition-transform ${
                          isEventDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isEventDropdownOpen && (
                      <div className="absolute no-visible-scrollbar z-50 mt-1 w-full bg-neutral-700 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                        {Object.values(Events)
                          .filter(
                            (eventName) => !selectedEvents.includes(eventName)
                          )
                          .map((eventName) => (
                            <button
                              key={eventName}
                              onClick={() => handleEventAdd(eventName)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                              {eventName.replace(/_/g, " ")}
                            </button>
                          ))}
                        {Object.values(Events).filter(
                          (eventName) => !selectedEvents.includes(eventName)
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-neutral-400">
                            No more events available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Event Information - Only show when not editing */}
            {!isEditing && (
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FaUser className="text-blue-400" />
                  {initialUserInfo.role === "ADMIN"
                    ? "Events Managing"
                    : "Event Participation"}
                </h4>

                {initialUserInfo.role === "ADMIN" &&
                initialUserInfo.eventHeads &&
                initialUserInfo.eventHeads.length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-medium mb-2">
                      Managing {initialUserInfo.eventHeads.length} events:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {initialUserInfo.eventHeads.map((event) => (
                        <div
                          key={event.eventId}
                          className="bg-neutral-700 bg-opacity-40 rounded-lg p-2 text-sm"
                        >
                          {event.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : initialUserInfo.role === "USER" &&
                  initialUserInfo.eventParticipation &&
                  initialUserInfo.eventParticipation.length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-medium mb-2">
                      Participating in{" "}
                      {initialUserInfo.eventParticipation.length} events:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {initialUserInfo.eventParticipation.map((event) => (
                        <div
                          key={event.eventId}
                          className="bg-neutral-700 bg-opacity-40 rounded-lg p-2 text-sm"
                        >
                          {event.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-400">
                    {initialUserInfo.role === "ADMIN"
                      ? "Not managing any events"
                      : "Not participating in any events"}
                  </p>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default UserProfileModal;
