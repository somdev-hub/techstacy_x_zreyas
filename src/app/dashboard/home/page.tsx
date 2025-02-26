"use client";
import React, { useState } from "react";
import { EventCard } from "@/components/EventCards";
import { ThreeDCard } from "@/components/ThreeDCard";
import { FaBell, FaTimes } from "react-icons/fa";

// Sample notification data
const notifications = [
  {
    id: 1,
    title: "New Event Registration",
    message: "You have successfully registered for Hackathon 2023",
    time: "2 hours ago",
    read: false
  },
  {
    id: 2,
    title: "Event Reminder",
    message: "Technical Workshop starts in 3 hours",
    time: "3 hours ago",
    read: true
  },
  {
    id: 3,
    title: "Registration Deadline",
    message: "Last day to register for Coding Competition",
    time: "1 day ago",
    read: true
  }
];

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className="bg-neutral-900 overflow-y-scroll no-visible-scrollbar pt-6 w-full px-8 my-2 mr-2 rounded-2xl pb-8">
      <div className="flex justify-between items-center">
        <div className="">
          <h1 className="text-[1.5rem] font-[700]">Dashboard</h1>
          <p className="text-[1.25rem]">Welcome to your dashboard</p>
        </div>
        <div
          className="bg-neutral-800 p-4 rounded-xl shadow-md cursor-pointer hover:bg-neutral-700 relative"
          onClick={toggleModal}
        >
          <FaBell className="text-2xl" />
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </div>
      </div>
      {/* Notification Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
            onClick={toggleModal}
          />
          <div className="fixed top-24 right-8 w-96 bg-neutral-800 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Notifications</h2>
              <button
                onClick={toggleModal}
                className="hover:bg-neutral-700 p-2 rounded-full"
              >
                <FaTimes />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-neutral-400">
                  No notifications
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-neutral-700 hover:bg-neutral-700 cursor-pointer ${
                      !notification.read ? "bg-neutral-700 bg-opacity-40" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <span className="text-xs text-neutral-400">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300 mt-1">
                      {notification.message}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-neutral-700">
              <button className="w-full text-center text-sm text-blue-400 hover:text-blue-300">
                Mark all as read
              </button>
            </div>
          </div>
        </>
      )}
      <div className="mt-8 w-full">
        <div className="flex gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full">
            <h1 className="text-[1.125rem] font-[700]">Technical Events</h1>
            <EventCard />
          </div>
          <div className="">
            <ThreeDCard />
          </div>
        </div>
      </div>
      <div className="mt-8 w-full">
        <div className="flex flex-row-reverse gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full">
            <h1 className="text-[1.125rem] font-[700]">
              Non-technical & Sports Events
            </h1>
            <EventCard />
          </div>
          <div className="">
            <ThreeDCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
