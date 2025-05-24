"use client"

import Link from "next/link"

export default function ClientPage() {
  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="text-[#79B791] font-semibold text-4xl relative">
            <span className="inline-block rounded-full bg-[#79B791] text-white px-3 py-1">é</span>
            <span className="text-[#13262F] ml-2">tude</span>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-4">
          <h1 className="text-3xl font-medium text-[#13262F]">Welcome to étude</h1>
          <p className="text-[#13262F]/60 text-lg">A beautiful and minimal note-taking application</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/sign-in"
            className="w-full block px-6 py-3 text-white bg-[#79B791] rounded-lg hover:bg-[#ABD1B5] focus:outline-none focus:ring-2 focus:ring-[#79B791] focus:ring-offset-2 transition-colors duration-200 font-medium"
          >
            Sign In
          </Link>

          <Link
            href="/sign-up"
            className="w-full block px-6 py-3 text-[#13262F] bg-transparent border border-[#ABD1B5] rounded-lg hover:bg-[#ABD1B5]/10 focus:outline-none focus:ring-2 focus:ring-[#79B791] focus:ring-offset-2 transition-colors duration-200 font-medium"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}
