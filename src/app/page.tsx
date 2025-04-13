"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Taskit</h1>
            </div>
            <div className="flex items-center">
              {user ? (
                <Link
                  href="/boards"
                  className="ml-4 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Go to Boards
                </Link>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Organize your work</span>
            <span className="block text-blue-600">with Taskit</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            A simple, flexible, and powerful way to organize your projects and
            tasks. Collaborate with your team and get more done.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            {!user && (
              <div className="rounded-md shadow">
                <Link
                  href="/auth/register"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
