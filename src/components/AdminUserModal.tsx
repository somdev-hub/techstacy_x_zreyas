import React, { useRef, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userFormSchema, type UserFormData } from "@/lib/schemas";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaIdCard,
  FaEdit,
  FaCheck,
  FaTimes as FaCancel,
  FaChevronDown,
  FaTrash,
} from "react-icons/fa";
import { Events } from "@prisma/client";
import { toast } from "sonner";

interface AdminUserModalProps {
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
    eventParticipation?: { eventId: number; name: string }[];
    eventHeads?: { eventId: number; name: string; eventName: Events }[];
  };
  onUpdate?: () => void; // Callback to refresh the users list after update
  currentUserRole?: string; // Add role of current logged in user
}

const AdminUserModal = ({
  isOpen,
  onClose,
  userInfo: initialUserInfo,
  onUpdate,
  currentUserRole,
}: AdminUserModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Events[]>([]);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSuperAdmin = currentUserRole === "SUPERADMIN";

  // Ensure default values for all form fields to prevent controlled/uncontrolled input warnings
  const defaultValues = {
    name: initialUserInfo.name || "",
    email: initialUserInfo.email || "",
    phone: initialUserInfo.phone || "",
    sic: initialUserInfo.sic || "",
    year:
      (initialUserInfo.year as
        | "FIRST_YEAR"
        | "SECOND_YEAR"
        | "THIRD_YEAR"
        | "FOURTH_YEAR") || "FIRST_YEAR",
    managedEvents: initialUserInfo.eventHeads?.map((eh) => eh.eventName) || [],
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (initialUserInfo.eventHeads) {
      setSelectedEvents(initialUserInfo.eventHeads.map((eh) => eh.eventName));
    } else {
      setSelectedEvents([]);
    }

    // Update form values when initialUserInfo changes
    reset({
      name: initialUserInfo.name || "",
      email: initialUserInfo.email || "",
      phone: initialUserInfo.phone || "",
      sic: initialUserInfo.sic || "",
      year:
        (initialUserInfo.year as
          | "FIRST_YEAR"
          | "SECOND_YEAR"
          | "THIRD_YEAR"
          | "FOURTH_YEAR") || "FIRST_YEAR",
      managedEvents:
        initialUserInfo.eventHeads?.map((eh) => eh.eventName) || [],
    });
  }, [initialUserInfo, reset]);

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

  const handleDeleteUser = async () => {
    if (!initialUserInfo.id) {
      toast.error("User ID is missing");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/users/${initialUserInfo.id}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      if (onUpdate) onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setIsUpdating(false);
      setShowDeleteConfirmation(false);
    }
  };

  if (!isOpen) return null;

  const handleEventAdd = (eventName: Events) => {
    if (!selectedEvents.includes(eventName)) {
      setSelectedEvents((prev) => [...prev, eventName]);
    }
    setIsEventDropdownOpen(false);
  };

  const handleEventRemove = (eventName: string) => {
    setSelectedEvents((prev) => prev.filter((e) => e !== eventName));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      reset();
    }
    setIsEditing(!isEditing);
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsUpdating(true);
      const formData = new FormData();
      
      // Add basic user data
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('sic', data.sic);
      formData.append('year', data.year);
      if (data.password) {
        formData.append('password', data.password);
      }

      // Add managed events if user is admin
      if (initialUserInfo.role === "ADMIN") {
        formData.append('managedEvents', JSON.stringify(selectedEvents));
      }

      const response = await fetch(`/api/users/${initialUserInfo.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to update user");

      await response.json();
      setIsEditing(false);
      if (onUpdate) onUpdate();
      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={isEditing ? undefined : onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] sm:w-[80%] md:w-[35rem] bg-neutral-800 rounded-xl shadow-lg z-50 flex flex-col max-h-[85vh]">
        {isUpdating && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-neutral-300">
                {showDeleteConfirmation ? "Deleting user..." : "Updating user..."}
              </p>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
            <div className="bg-neutral-800 p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-red-500">Confirm Delete</h3>
              <p className="mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-neutral-700 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold">
            {isEditing ? "Edit User" : "User Details"}
          </h2>
          <div className="flex items-center gap-1 sm:gap-2">
            {!isEditing ? (
              <>
                {/* Delete Button for SUPERADMIN only */}
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="hover:bg-red-900 p-1.5 sm:p-2 rounded-full flex items-center gap-1 text-red-500 hover:text-red-400"
                    title="Delete User"
                  >
                    <FaTrash />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="hover:bg-neutral-700 p-1.5 sm:p-2 rounded-full flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  <FaEdit />
                  <span className="hidden sm:inline text-sm">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="hover:bg-neutral-700 p-1.5 sm:p-2 rounded-full"
                >
                  <FaTimes />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 sm:px-3 rounded-lg transition-colors flex items-center gap-1 text-sm"
                >
                  <FaCheck />
                  <span className="hidden sm:inline">Save</span>
                </button>
                <button
                  type="button"
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
          <form
            onSubmit={(e) => {
              e.preventDefault(); // Prevent form from submitting automatically
              if (isEditing) {
                handleSubmit(onSubmit)(e);
              }
            }}
            className="p-4 space-y-4"
          >
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40">
                <div className="flex items-center gap-2">
                  <FaUser className="text-blue-400 text-lg flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-neutral-400">Name</p>
                    {isEditing ? (
                      <div>
                        <Controller
                          name="name"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className="w-full bg-neutral-600 rounded px-2 py-1 mt-1"
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
                      <p className="truncate">{initialUserInfo.name}</p>
                    )}
                  </div>
                </div>
              </div>

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
                      <p className="truncate">{initialUserInfo.email}</p>
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
                      <p>{initialUserInfo.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40">
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
                      <p>{initialUserInfo.sic}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* College and Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40">
                <div className="flex items-center gap-2">
                  <FaGraduationCap className="text-blue-400 text-lg flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-neutral-400">College</p>
                    <p className="truncate">{initialUserInfo.college}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40">
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
                        {initialUserInfo.year?.replace("_", " ")?.toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Password Reset */}
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

            {/* Event Management for Admins */}
            {initialUserInfo.role === "ADMIN" && (
              <div className="p-3 rounded-lg bg-neutral-700 bg-opacity-40">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FaUser className="text-blue-400" />
                    {isEditing ? "Manage Events" : "Events Managing"}
                  </h4>

                  {isEditing ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvents.map((eventName, index) => (
                          <div
                            key={index}
                            className="bg-blue-500 bg-opacity-20 text-sm rounded-full px-3 py-1 flex items-center gap-2"
                          >
                            <span>{eventName.replace(/_/g, " ")}</span>
                            <button
                              type="button"
                              onClick={() => handleEventRemove(eventName)}
                              className="hover:text-red-400 transition-colors"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
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
                          <div className="absolute z-50 mt-1 w-full bg-neutral-700 rounded-lg shadow-lg max-h-[200px] overflow-y-auto no-visible-scrollbar">
                            {Object.values(Events)
                              .filter(
                                (eventName) =>
                                  !selectedEvents.includes(eventName)
                              )
                              .map((eventName, index) => (
                                <button
                                  type="button"
                                  key={index}
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
                    </>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {initialUserInfo.eventHeads &&
                      initialUserInfo.eventHeads.length > 0 ? (
                        initialUserInfo.eventHeads.map((event, index) => (
                          <div
                            key={index}
                            className="bg-neutral-700 bg-opacity-40 rounded-lg p-2 text-sm"
                          >
                            {event.name}
                          </div>
                        ))
                      ) : (
                        <p className="text-neutral-400">
                          Not managing any events
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Event Participation for Users */}
            {initialUserInfo.role === "USER" && (
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FaUser className="text-blue-400" />
                  Event Participation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {initialUserInfo.eventParticipation &&
                  initialUserInfo.eventParticipation.length > 0 ? (
                    initialUserInfo.eventParticipation.map((event, index) => (
                      <div
                        key={index}
                        className="bg-neutral-700 bg-opacity-40 rounded-lg p-2 text-sm"
                      >
                        {event.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400">
                      Not participating in any events
                    </p>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminUserModal;
