"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Board {
  _id: string;
  title: string;
  description?: string;
}

export default function BoardsPage() {
  const { user, loading, logout, token } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    } else if (user) {
      const fetchBoards = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/boards", {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error("Failed to fetch boards");
          const data = await response.json();
          setBoards(data);
        } catch (error) {
          console.error("Error fetching boards:", error);
          setError("Failed to load boards");
        }
      };

      fetchBoards();
    }
  }, [user, loading, router, token]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const response = await fetch("http://localhost:5000/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newBoardTitle }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to create board");

      const newBoard = await response.json();
      setBoards([...boards, newBoard]);
      setNewBoardTitle("");
    } catch (error) {
      console.error("Error creating board:", error);
      setError("Failed to create board");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => logout()}
                className="ml-4 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleCreateBoard} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Enter board title"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Board
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <div
              key={board._id}
              onClick={() => router.push(`/boards/${board._id}`)}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-medium text-gray-900">
                {board.title}
              </h3>
              {board.description && (
                <p className="mt-1 text-gray-500">{board.description}</p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
