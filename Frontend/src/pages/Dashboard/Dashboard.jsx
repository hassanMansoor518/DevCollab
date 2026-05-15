import React from "react";
import {
  FiSearch,
  FiUser,
  FiCheckCircle,
  FiFileText,
  FiMessageSquare,
} from "react-icons/fi";
import { AiOutlineStar } from "react-icons/ai";

import DashboardLeftSide from "./DashboardLeftSide";
import ActiveTeam from "./ActiveTeam";
import Notification from "../../component/Notification";
import DashboardHeader from "../../component/DashboardHeader";

const Dashboard = () => {
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const user = authUser?.user;

  return (
    <div className="flex h-screen bg-[#0B1120] text-white ">
      {/* Sidebar */}
      <DashboardLeftSide />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Top Bar */}
        <DashboardHeader />

        {/* Dashboard Feed */}
        <h2 className="text-2xl font-bold mb-4">Dashboard Feed</h2>
        <p className="text-gray-400 mb-6">
          Your workspace activities and insights from the last 24 hours.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Feed Left */}
          <div className="md:col-span-2 space-y-4">
            {/* Commit Card */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">
                  COMMIT • 12M AGO
                </span>
                <span className="text-green-500 font-semibold flex items-center">
                  SUCCESS <FiCheckCircle className="ml-1" />
                </span>
              </div>

              <h3 className="font-semibold mb-2">
                Feature: Enhanced Auth Provider
              </h3>

              <p className="text-gray-400 text-sm mb-2">
                Merged PR #124 from 'feature/oauth-v2'. Implementation of Google and Github social logins with session persistence.
              </p>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <img
                    src="https://i.pravatar.cc/30?img=5"
                    alt=""
                    className="w-6 h-6 rounded-full border-2 border-gray-800"
                  />
                  <img
                    src="https://i.pravatar.cc/30?img=6"
                    alt=""
                    className="w-6 h-6 rounded-full border-2 border-gray-800"
                  />
                </div>

                <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition flex items-center">
                  <FiFileText className="mr-1" />
                  View Diff
                </button>
              </div>
            </div>

            {/* AI Action Card */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center mb-2">
                <AiOutlineStar className="text-purple-500 mr-2" />
                <span className="text-xs text-gray-400">
                  AI ACTION • 1H AGO
                </span>
              </div>

              <h3 className="font-semibold mb-2">
                Automated Code Review Completed
              </h3>

              <p className="text-gray-400 text-sm mb-2">
                "Found 3 potential performance bottlenecks in server/api/v1/data.py and suggested refactoring for list comprehensions."
              </p>

              <div className="flex space-x-2">
                <button className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 transition flex items-center">
                  <FiFileText className="mr-1" />
                  See Suggestions
                </button>

                <button className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 transition flex items-center">
                  <FiCheckCircle className="mr-1" />
                  Dismiss
                </button>
              </div>
            </div>

            {/* Message Card */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center mb-2">
                <FiMessageSquare className="mr-2 text-yellow-500" />
                <span className="text-xs text-gray-400">
                  MESSAGE • 3H AGO
                </span>
              </div>

              <h3 className="font-semibold mb-2">
                Sarah Jenks
              </h3>

              <p className="text-gray-400 text-sm mb-2">
                Hey team, I've updated the Figma file for the new dashboard components. Take a look when you have a chance!
              </p>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center">
                  #design-ops <FiFileText className="ml-1" />
                </span>

                <a
                  href="#"
                  className="text-blue-500 text-sm hover:underline transition"
                >
                  Download
                </a>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* AI Summary */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">AI Summary</h3>
                <AiOutlineStar className="text-purple-500" />
              </div>

              <p className="text-xs text-gray-400 mb-2">
                STATUS:
                <span className="text-green-500 flex items-center">
                  ON TRACK <FiCheckCircle className="ml-1" />
                </span>
              </p>

              <p className="text-sm mb-2">
                Workspace productivity is up 12% this week.
                Primary focus: <strong>API Integration</strong>.
              </p>

              <ul className="text-gray-400 text-xs mb-2">
                <li>• 3 critical PRs merged today</li>
                <li>• Security audit pending for 'billing-service'</li>
                <li>• Team velocity stable at 42pts</li>
              </ul>

              <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition w-full flex items-center">
                <FiFileText className="mr-1" />
                Full Report
              </button>
            </div>

            {/* Active Team */}
            <ActiveTeam currentUserId={user?._id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
