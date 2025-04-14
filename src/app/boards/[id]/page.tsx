"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
} from "@hello-pangea/dnd";
import CardModal from "@/components/CardModal";

interface Card {
  _id: string;
  title: string;
  description?: string;
  list: string;
  position: number;
  completed: boolean;
  dueDate?: Date;
}

interface List {
  _id: string;
  title: string;
  board: string;
  cards: Card[];
  position: number;
}

interface Board {
  _id: string;
  title: string;
  description?: string;
  lists: List[];
  backgroundColor?: string;
}

export default function BoardPage() {
  const { id } = useParams();
  const { user, loading, logout, token } = useAuth();
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [activeList, setActiveList] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [error, setError] = useState("");
  const [activeMenuListId, setActiveMenuListId] = useState<string | null>(null);
  const [showListForm, setShowListForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    } else if (user) {
      const fetchBoard = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/boards/${id}`,
            {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!response.ok) throw new Error("Failed to fetch board");
          const data = await response.json();
          setBoard(data);
        } catch (error) {
          console.error("Error fetching board:", error);
          setError("Failed to load board");
        }
      };
      fetchBoard();
    }
  }, [user, loading, router, token, id]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const response = await fetch("http://localhost:5000/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newListTitle,
          board: id,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to create list");

      const newList = await response.json();
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              lists: [...prev.lists, newList],
            }
          : null
      );
      setNewListTitle("");
      setShowListForm(false);
    } catch (error) {
      console.error("Error creating list:", error);
      setError("Failed to create list");
    }
  };

  const handleCreateCard = async (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    if (!newCardTitle.trim() || !activeList) return;

    try {
      const response = await fetch("http://localhost:5000/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newCardTitle,
          list: listId,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to create card");

      const newCard = await response.json();
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lists: prev.lists.map((list) =>
            list._id === listId
              ? { ...list, cards: [...list.cards, newCard] }
              : list
          ),
        };
      });
      setNewCardTitle("");
      setActiveList(null);
    } catch (error) {
      console.error("Error creating card:", error);
      setError("Failed to create card");
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !board) return;

    const { source, destination, draggableId, type } = result;

    // Reordering lists
    if (type === "list") {
      const newLists = Array.from(board.lists);
      const [removed] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, removed);

      setBoard((prev) => (prev ? { ...prev, lists: newLists } : null));

      try {
        await fetch(`http://localhost:5000/api/lists/${draggableId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            position: destination.index,
          }),
          credentials: "include",
        });
      } catch (error) {
        console.error("Error updating list position:", error);
        setError("Failed to update list position");
      }
    }

    // Moving cards between lists
    if (type === "card") {
      const sourceList = board.lists.find((list) =>
        list.cards.some((card) => card._id === draggableId)
      );
      const destList = board.lists.find(
        (list) => list._id === destination.droppableId
      );
      if (!sourceList || !destList) return;

      console.log(result);
      console.log(sourceList, destList);

      // Moving card within the same list
      if (destination.droppableId === sourceList._id) {
        console.log("Moving card within the same list");
        const sourceCards = Array.from(sourceList.cards);
        const [removed] = sourceCards.splice(source.index, 1);
        sourceCards.splice(destination.index, 0, removed);
        setBoard((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            lists: prev.lists.map((list) => {
              if (list._id === sourceList._id) {
                return { ...list, cards: sourceCards };
              }
              return list;
            }),
          };
        });
      } else {
        // Moving card between lists
        const sourceCards = Array.from(sourceList.cards);
        const destCards = Array.from(destList.cards);
        const [removed] = sourceCards.splice(source.index, 1);
        destCards.splice(destination.index, 0, removed);

        setBoard((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            lists: prev.lists.map((list) => {
              if (list._id === sourceList._id) {
                return { ...list, cards: sourceCards };
              }
              if (list._id === destList._id) {
                return { ...list, cards: destCards };
              }
              return list;
            }),
          };
        });
      }

      try {
        await fetch(`http://localhost:5000/api/cards/${draggableId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            list: destination.droppableId,
            position: destination.index,
          }),
          credentials: "include",
        });
      } catch (error) {
        console.error("Error updating card position:", error);
        setError("Failed to update card position");
      }
    }
  };

  const handleCardUpdate = (updatedCard: Card) => {
    setBoard((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lists: prev.lists.map((list) => ({
          ...list,
          cards: list.cards.map((card) =>
            card._id === updatedCard._id ? updatedCard : card
          ),
        })),
      };
    });
  };

  const toggleMenu = (listId: string) => {
    setActiveMenuListId((prev) => (prev === listId ? null : listId));
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/lists/${listId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to delete list");

      // Update the board state to remove the deleted list
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lists: prev.lists.filter((list) => list._id !== listId),
        };
      });
    } catch (error) {
      console.error("Error deleting list:", error);
      setError("Failed to delete list");
    }
  };

  const handleCardCompletionToggle = async (card: Card) => {
    try {
      const updatedCard = {
        ...card,
        completed: !card.completed, // Toggle the completed state
      };

      const response = await fetch(
        `http://localhost:5000/api/cards/${card._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedCard),
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to update card");

      const newCard = await response.json();
      handleCardUpdate(newCard); // Update the card in the state
    } catch (error) {
      console.error("Error updating card:", error);
      setError("Failed to update card");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Board not found</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: board.backgroundColor || "#ffffff" }}
    >
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                🏠
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {board.title}
              </h1>
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

        <div className="mb-8">
          <button
            onClick={() => setShowListForm(!showListForm)}
            className="w-full p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            {showListForm ? "Cancel" : "Create New List"}
          </button>
        </div>

        {showListForm && (
          <form
            onSubmit={handleCreateList}
            className="mb-8 p-6 bg-white rounded-lg shadow-sm"
          >
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Enter list title"
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create List
              </button>
            </div>
          </form>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="lists" type="list" direction="horizontal">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex gap-4 overflow-x-auto pb-4"
              >
                {board.lists.map((list, index) => (
                  <Draggable
                    key={list._id}
                    draggableId={list._id}
                    index={index}
                  >
                    {(provided: DraggableProvided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex-shrink-0 w-80"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="bg-white rounded-lg shadow-sm p-4 relative"
                        >
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {list.title}
                          </h3>

                          <button
                            onClick={() => toggleMenu(list._id)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            aria-label="Options"
                          >
                            ⚙️
                          </button>

                          {activeMenuListId === list._id && (
                            <div className="absolute right-4 top-12 bg-white border rounded shadow-md z-10">
                              <ul className="py-2">
                                <li
                                  onClick={() => handleDeleteList(list._id)}
                                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                >
                                  Delete List
                                </li>
                              </ul>
                            </div>
                          )}

                          <Droppable droppableId={list._id} type="card">
                            {(provided: DroppableProvided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="space-y-2"
                              >
                                {list.cards.map((card, index) => (
                                  <Draggable
                                    key={card._id}
                                    draggableId={card._id}
                                    index={index}
                                  >
                                    {(provided: DraggableProvided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="bg-white p-3 rounded shadow-sm hover:shadow-md cursor-pointer flex items-center"
                                        onClick={() => setSelectedCard(card)}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={card.completed}
                                          onChange={() =>
                                            handleCardCompletionToggle(card)
                                          }
                                          className="mr-2"
                                        />
                                        <h4 className="text-sm font-medium text-gray-900">
                                          {card.title}
                                        </h4>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>

                          {activeList === list._id ? (
                            <form
                              onSubmit={(e) => handleCreateCard(e, list._id)}
                              className="mt-4"
                            >
                              <input
                                type="text"
                                value={newCardTitle}
                                onChange={(e) =>
                                  setNewCardTitle(e.target.value)
                                }
                                placeholder="Enter card title"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                autoFocus
                              />
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="submit"
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                >
                                  Add Card
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveList(null);
                                    setNewCardTitle("");
                                  }}
                                  className="px-3 py-1 text-gray-600 text-sm rounded-md hover:bg-gray-100"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() => setActiveList(list._id)}
                              className="mt-4 w-full text-left text-sm text-gray-500 hover:text-gray-700"
                            >
                              + Add a card
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
        />
      )}
    </div>
  );
}
