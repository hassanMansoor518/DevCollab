import React from "react";
import DashboardHeader from "../../component/DashboardHeader";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide";

export default function ReportsPage() {
  return (
    <div className="flex h-screen bg-[#050B18] text-white font-[Inter] overflow-hidden">

      {/* GOOGLE FONTS + ICONS */}
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&family=Material+Symbols+Outlined" rel="stylesheet"/>

      {/* SIDEBAR */}
      <DashboardLeftSide />

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-br from-[#050B18] via-[#071428] to-[#030712]">

        <DashboardHeader />

        {/* HEADER */}
        <div className="flex justify-between items-end mt-8 mb-8">
          <div>
            <p className="text-xs text-blue-400 tracking-widest mb-2">
              ANALYZER • REPORTS OVERVIEW
            </p>
            <h1 className="text-4xl font-[Manrope] font-extrabold">
              Reports Overview
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Audit and performance metrics across 12 connected repositories.
            </p>
          </div>

          <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 rounded-lg font-semibold text-sm text-white hover:from-blue-700 hover:to-blue-600 transition">
            <span className="material-symbols-outlined ">add_circle</span>
            Generate New Report
          </button>
        </div>

       

        {/* SEARCH + FILTER */}
        <div className="flex items-center gap-4 bg-[#0e1625] p-4 rounded-md border border-[#1f2a44] mb-6">

          <div className="flex items-center gap-2 flex-1">
            <span className="material-symbols-outlined text-gray-400">search</span>
            <input
              placeholder="Search by project name..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <button className="flex items-center gap-1 bg-[#0b1220] px-3 py-2 rounded text-sm text-gray-300">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            Last 30 Days
          </button>

          <button className="flex items-center gap-1 bg-[#0b1220] px-3 py-2 rounded text-sm text-gray-300">
            <span className="material-symbols-outlined text-sm">tune</span>
            Status
          </button>
        </div>

        {/* REPORT CARDS */}
        <div className="space-y-4">

          <ReportCard
            title="Core-Engine / production-v4"
            time="Oct 24, 2023 • 14:20"
            author="J. Miller"
            health="98/100"
            warnings="12 Warnings"
            border="border-[#00e5ff]"
            badge="HEALTHY"
            badgeColor="text-[#00e5ff]"
          />

          <ReportCard
            title="Auth-Service / nightly-build"
            time="Oct 23, 2023 • 03:45"
            author="System Agent"
            health="42/100"
            warnings="48 Warnings"
            border="border-red-500"
            badge="CRITICAL"
            badgeColor="text-red-400"
          />

          <ReportCard
            title="Legacy-Portal / hotfix-2"
            time="Oct 22, 2023 • 09:12"
            author="S. Chen"
            health="89/100"
            warnings="3 Warnings"
            border="border-purple-500"
            badge="STABLE"
            badgeColor="text-purple-400"
          />

        </div>

        {/* PAGINATION */}
        <div className="flex justify-center mt-8 gap-2">
          <button className="px-3 py-1 bg-[#0b1220] rounded text-sm">{"<"}</button>
          <button className="px-3 py-1 bg-[#1f3b6d] rounded text-sm">1</button>
          <button className="px-3 py-1 bg-[#0b1220] rounded text-sm">2</button>
          <button className="px-3 py-1 bg-[#0b1220] rounded text-sm">3</button>
          <button className="px-3 py-1 bg-[#0b1220] rounded text-sm">...</button>
          <button className="px-3 py-1 bg-[#0b1220] rounded text-sm">12</button>
          <button className="px-3 py-1 bg-[#0b1220] rounded text-sm">{">"}</button>
        </div>

      </div>
    </div>
  );
}


/* ================= COMPONENTS ================= */

function StatCard({ title, value, sub, blue, red }) {
  return (
    <div className="bg-[#1c1b1c] p-5 rounded-lg border border-[#2a2a2a]">
      <p className="text-gray-400 text-xs">{title}</p>
      <h2 className={`text-3xl font-bold mt-1 ${
        blue ? "text-[#00e5ff]" :
        red ? "text-red-400" : ""
      }`}>
        {value}
      </h2>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ReportCard({
  title,
  time,
  author,
  health,
  warnings,
  border,
  badge,
  badgeColor
}) {
  return (
    <div className={`bg-[#0e1625] p-6 rounded-lg border-l-4 ${border}`}>

      <div className="flex justify-between items-start">

        {/* LEFT */}
        <div>
          <h3 className="font-bold text-lg">{title}</h3>

          <div className="text-gray-400 text-xs mt-1 flex gap-4">
            <span>{time}</span>
            <span>{author}</span>
          </div>

          <p className={`text-xs mt-3 font-semibold ${badgeColor}`}>
            {badge}
          </p>
        </div>

        {/* RIGHT */}
        <div className="text-right">
          <p className={`text-sm font-bold ${badgeColor}`}>
            Health: {health}
          </p>
          <p className="text-xs text-gray-400">{warnings}</p>

          <div className="flex gap-3 mt-3 justify-end">
            <button className="text-gray-400 text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">
                download
              </span>
              Download
            </button>

            <button className="bg-[#2a2a2b] px-4 py-2 rounded text-xs">
              View Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}