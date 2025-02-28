import React from "react";

const Payments = () => {
  return (
    <div>
      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 max-h-[475px] w-full">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-[1.125rem] font-[700]">Tshirt payments</h1>
              <div className="flex gap-4">
                <select className="bg-neutral-700 rounded-md px-3 py-1">
                  <option value="">Event Type</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="NON_TECHNICAL">Non-Technical</option>
                  <option value="SPORTS">Sports</option>
                </select>
                <select className="bg-neutral-700 rounded-md px-3 py-1">
                  <option value="">Event Name</option>
                  <option value="event1">Event 1</option>
                  <option value="event2">Event 2</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Year</th>
                    <th className="text-left p-2">Event</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-700">
                    <td className="p-2">John Doe</td>
                    <td className="p-2">2024</td>
                    <td className="p-2">Hackathon</td>
                    <td className="p-2">
                      <button className="bg-blue-600 px-3 py-1 rounded-md">
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8 w-full">
          <div className="w-full">
            <div className="bg-neutral-800 rounded-xl shadow-md p-4 max-h-[475px]">
              <div className="flex justify-between">
                <h1 className="text-[1.125rem] font-[700]">
                  Event participants payments
                </h1>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-4">
                    <select className="bg-neutral-700 rounded-md px-3 py-1">
                      <option value="">Event Type</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="NON_TECHNICAL">Non-Technical</option>
                      <option value="SPORTS">Sports</option>
                    </select>
                    <select className="bg-neutral-700 rounded-md px-3 py-1">
                      <option value="">Event Name</option>
                      <option value="event1">Event 1</option>
                      <option value="event2">Event 2</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-700">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Year</th>
                        <th className="text-left p-2">Event</th>
                        <th className="text-left p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-neutral-700">
                        <td className="p-2">John Doe</td>
                        <td className="p-2">2024</td>
                        <td className="p-2">Hackathon</td>
                        <td className="p-2">
                          <button className="bg-blue-600 px-3 py-1 rounded-md">
                            View
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
