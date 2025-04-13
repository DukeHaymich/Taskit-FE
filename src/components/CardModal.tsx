"use client";

import { useState, useEffect } from "react";

interface Card {
  _id: string;
  title: string;
  description?: string;
  list: string;
  position: number;
}

interface CardModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedCard: Card) => void;
}

export default function CardModal({
  card,
  isOpen,
  onClose,
  onUpdate,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || "");
  }, [card]);

  const handleSave = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/cards/${card._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to update card");

      const updatedCard = await response.json();
      onUpdate(updatedCard);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating card:", error);
      setError("Failed to update card");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              ) : (
                title
              )}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Description
            </h3>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a description..."
              />
            ) : (
              <p
                className="text-gray-700 whitespace-pre-wrap cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => setIsEditing(true)}
              >
                {description || "Add a description..."}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setTitle(card.title);
                    setDescription(card.description || "");
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
