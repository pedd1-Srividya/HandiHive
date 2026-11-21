
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { errMsg } from "../services/api";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/api\/?$/, "");

export default function Chat() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const requestedCreatorId = searchParams.get("creator_id");

  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const isCreator = user?.role === "creator";

  const loadConversations = async () => {
    try {
      const response = await api.get("/chat/conversations");
      const list = response.data || [];

      setConversations(list);

      if (isCreator) {
        if (list.length > 0) {
          setSelected((previous) => {
            if (previous) {
              const existing = list.find(
                (item) => item.customer_id === previous.customer_id
              );
              if (existing) return existing;
            }
            return list[0];
          });
        }
      } else if (requestedCreatorId) {
        const existing = list.find(
          (item) => item.creator_id === Number(requestedCreatorId)
        );

        setSelected(
          existing || {
            creator_id: Number(requestedCreatorId),
            creator_name: "Creator",
            customer_id: user.id,
            customer_name: user.name,
          }
        );
      } else if (list.length > 0) {
        setSelected((previous) => {
          if (previous) {
            const existing = list.find(
              (item) => item.creator_id === previous.creator_id
            );
            if (existing) return existing;
          }
          return list[0];
        });
      }
    } catch (err) {
      setError(errMsg(err));
    }
  };

  // Initialize conversations
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const initialize = async () => {
      setLoading(true);
      await loadConversations();

      if (!cancelled) {
        setLoading(false);
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [user?.id, requestedCreatorId]);

  // Automatically refresh messages every 3 seconds
  useEffect(() => {
    if (!selected || !user) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    let interval;

    const loadMessages = async () => {
      try {
        const params = {
          creator_id: selected.creator_id,
          customer_id: selected.customer_id || user.id,
        };

        const response = await api.get("/chat/messages", {
          params,
        });

        if (!cancelled) {
          setMessages(response.data || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(errMsg(err));
        }
      }
    };

    loadMessages();

    interval = setInterval(loadMessages, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    selected?.creator_id,
    selected?.customer_id,
    user?.id,
    isCreator,
  ]);

  // Refresh conversation list every 3 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadConversations();
    }, 3000);

    return () => clearInterval(interval);
  }, [user?.id, isCreator, requestedCreatorId]);

  // Image preview
  useEffect(() => {
    if (!image) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(image);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  // Send text message
  const handleSend = async (e) => {
    e.preventDefault();

    const text = message.trim();
    if (!text || !selected) return;

    try {
      setSending(true);
      setError("");

      const payload = {
        creator_id: selected.creator_id,
        message: text,
      };

      if (isCreator) {
        payload.customer_id = selected.customer_id;
      }

      const response = await api.post("/chat/messages", payload);

      setMessages((previous) => [...previous, response.data]);
      setMessage("");

      await loadConversations();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  // Select image
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      e.target.value = "";
      return;
    }

    setError("");
    setImage(file);
  };

  // Send image message
  const handleSendImage = async (e) => {
    e.preventDefault();

    if (!image || !selected) return;

    try {
      setSending(true);
      setError("");

      const formData = new FormData();

      formData.append("creator_id", selected.creator_id);

      if (isCreator) {
        formData.append("customer_id", selected.customer_id);
      }

      formData.append("caption", message.trim());
      formData.append("image", image);

      const response = await api.post(
        "/chat/messages/image",
        formData
      );

      setMessages((previous) => [...previous, response.data]);
      setImage(null);
      setMessage("");

      await loadConversations();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="text-center py-10">Loading chats...</p>;
  }

  const selectedName = isCreator
    ? selected?.customer_name
    : selected?.creator_name;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-plum">Messages</h1>
        <p className="text-plum/60 mt-1">
          Connect with handmade creators and customers.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversation list */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-bold text-lg mb-4">Conversations</h2>

          {conversations.length === 0 ? (
            <p className="text-sm text-gray-500">
              No conversations yet.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((item) => {
                const active = isCreator
                  ? selected?.customer_id === item.customer_id
                  : selected?.creator_id === item.creator_id;

                return (
                  <button
                    key={`${item.customer_id}-${item.creator_id}`}
                    onClick={() => setSelected(item)}
                    className={`w-full text-left rounded-xl p-3 transition ${
                      active
                        ? "bg-purple-100 border border-purple-300"
                        : "bg-gray-50 hover:bg-purple-50"
                    }`}
                  >
                    <p className="font-semibold">
                      {isCreator ? item.customer_name : item.creator_name}
                    </p>

                    <p className="text-sm text-gray-500 truncate mt-1">
                      {item.last_message}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {item.last_message_at
                        ? new Date(item.last_message_at).toLocaleString()
                        : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat window */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow flex flex-col min-h-[500px]">
          {selected ? (
            <>
              <div className="p-4 border-b">
                <h2 className="font-bold text-lg">{selectedName}</h2>
                <p className="text-sm text-gray-500">
                  {isCreator ? "Customer" : "Creator"}
                </p>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[450px]">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-400 mt-10">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const mine = msg.sender_role === user.role;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          mine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 ${
                            mine
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {msg.image_url && (
                            <a
                              href={`${API_ORIGIN}${msg.image_url}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={`${API_ORIGIN}${msg.image_url}`}
                                alt="Shared chat image"
                                className="max-w-full max-h-64 rounded-xl mb-2 object-contain"
                              />
                            </a>
                          )}

                          {msg.message && msg.message !== "Image" && (
                            <p className="whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                          )}

                          <p
                            className={`text-xs mt-2 ${
                              mine ? "text-purple-100" : "text-gray-400"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Image preview */}
              {preview && (
                <div className="border-t px-4 pt-3">
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="Selected image preview"
                      className="w-28 h-28 object-cover rounded-xl"
                    />

                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Message and image input */}
              <form
                onSubmit={image ? handleSendImage : handleSend}
                className="border-t p-4 space-y-3"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message or image caption..."
                    maxLength={2000}
                    className="flex-1 min-w-0 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />

                  <button
                    type="submit"
                    disabled={sending || (!message.trim() && !image)}
                    className="bg-purple-600 text-white px-5 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>

                <div className="flex items-center">
                  <label className="cursor-pointer text-purple-700 hover:text-purple-900 font-medium text-sm">
                    📎 Attach Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={sending}
                    />
                  </label>

                  <span className="text-xs text-gray-400 ml-3">
                    JPG, PNG or WEBP · Max 5 MB
                  </span>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 p-5 text-center">
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
