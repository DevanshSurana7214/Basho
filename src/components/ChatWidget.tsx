import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ShoppingBag,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type ProductLite = {
  id: string;
  name: string;
  price: number;
  category?: string;
};

type WorkshopLite = {
  id: string;
  title: string;
  price: number;
};

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  actions?: ChatAction[];
}

interface ChatAction {
  type: "add_to_cart" | "book_workshop" | "book_experience" | "view_product";
  label: string;
  data: {
    id?: string;
    name?: string;
    price?: number;
    type?: "product" | "workshop" | "experience";
  };
}

const N8N_WEBHOOK_URL =
  "https://rajdeeppa54.app.n8n.cloud/webhook/477df94d-8bcf-439e-a49d-b96ceb0a91a6/chat";

const formatMarkdown = (text: string): string => {
  return (
    text
      // Bold: **text**
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic: *text* (but not inside bold)
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
      // Inline code: `code`
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Bullet lists: lines starting with - or *
      .replace(/^[\-\*]\s+(.+)$/gm, "<li>$1</li>")
      // Wrap consecutive <li> in <ul>
      .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
      // Line breaks
      .replace(/\n/g, "<br />")
  );
};

const ChatWidget = () => {
  const [sessionId] = useState(() => crypto.randomUUID());
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hasPlayedIntroAnimation, setHasPlayedIntroAnimation] = useState(false);
  const [triggerBounce, setTriggerBounce] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm here to help you explore our handcrafted pottery, book workshops, and reserve experiences. How can I assist you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trigger bounce animation after Basho fade-in effect (1.2s loading + 1s fade = ~2.5s)
  useEffect(() => {
    if (!hasPlayedIntroAnimation && !isOpen) {
      const timer = setTimeout(() => {
        setTriggerBounce(true);
        setHasPlayedIntroAnimation(true);
        // Reset bounce after animation completes
        setTimeout(() => setTriggerBounce(false), 1000);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [hasPlayedIntroAnimation, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const normalize = (value: string) => value.toLowerCase().trim();

  const categoryFromQuery = (query: string): string | null => {
    const q = normalize(query);

    const categoryMap: Array<{ match: RegExp; category: string }> = [
      { match: /\bmug(s)?\b/, category: "Mugs" },
      { match: /\bbowl(s)?\b/, category: "Bowls" },
      { match: /\bplate(s)?\b/, category: "Plates" },
      { match: /\bplatter(s)?\b/, category: "Platters" },
      { match: /\btea\s*set(s)?\b|\bteaset(s)?\b/, category: "Tea Sets" },
      { match: /\bstorage\b|\bjar(s)?\b/, category: "Storage" },
      { match: /\bsculpture(s)?\b/, category: "Sculptures" },
      { match: /\bplanter(s)?\b/, category: "Planters" },
    ];

    for (const item of categoryMap) {
      if (item.match.test(q)) return item.category;
    }
    return null;
  };

  const looksLikeProductQuery = (query: string): boolean => {
    const q = normalize(query);
    return (
      /\b(show|browse|see|view|buy|order|shop|price|available)\b/.test(q) &&
      /(mug|bowl|plate|platter|tea\s*set|pottery|sculpture|planter|product|collection)/.test(
        q,
      )
    );
  };

  const looksLikeWorkshopQuery = (query: string): boolean => {
    const q = normalize(query);
    return /\b(workshop|class|session|wheel\s*throwing|beginner|kids)\b/.test(
      q,
    );
  };

  const looksLikeExperienceQuery = (query: string): boolean => {
    const q = normalize(query);
    return /\b(experience|studio\s*visit|pottery\s*date|birthday|celebration|private\s*session)\b/.test(
      q,
    );
  };

  const looksLikeCustomOrderQuery = (query: string): boolean => {
    const q = normalize(query);
    return /\b(custom\s*order|custom\s*made|personalized|bespoke)\b/.test(q);
  };

  const pushAssistantMessage = (content: string, actions?: ChatAction[]) => {
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content,
      role: "assistant",
      timestamp: new Date(),
      actions: actions && actions.length > 0 ? actions : undefined,
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  const handleCommerceIntent = async (userText: string): Promise<boolean> => {
    // Custom Orders
    if (looksLikeCustomOrderQuery(userText)) {
      pushAssistantMessage(
        "Sure — I can help with a custom order. Please open the custom order form and share your requirements (size, style, timeline, reference images).",
        [
          {
            type: "view_product",
            label: "Open Custom Order Form",
            data: { id: "custom", type: "product" },
          },
        ],
      );
      return true;
    }

    // Experiences
    if (looksLikeExperienceQuery(userText)) {
      pushAssistantMessage(
        "Yes! We offer studio experiences (couple pottery dates, celebrations, private sessions). Tap below to view and book.",
        [
          {
            type: "book_experience",
            label: "View Experiences",
            data: { id: "experiences" },
          },
        ],
      );
      return true;
    }

    // Workshops
    if (looksLikeWorkshopQuery(userText)) {
      const { data: workshops, error } = await supabase
        .from("workshops")
        .select("id, title, price")
        .eq("is_active", true)
        .limit(5);

      if (error) {
        console.error("Workshop fetch error:", error);
        pushAssistantMessage(
          "I can help you book a workshop, but I couldn't load the workshop list right now. Please try again or open the Workshops page.",
          [
            {
              type: "book_workshop",
              label: "Open Workshops",
              data: { id: "workshops", type: "workshop" },
            },
          ],
        );
        return true;
      }

      const workshopActions: ChatAction[] = (workshops as
        | WorkshopLite[]
        | null
        | undefined)
        ? (workshops as WorkshopLite[]).slice(0, 3).map((w) => ({
            type: "book_workshop",
            label: `Book ${w.title} - ₹${w.price}`,
            data: { id: w.id, name: w.title, price: w.price, type: "workshop" },
          }))
        : [];

      pushAssistantMessage(
        workshops && workshops.length > 0
          ? "Here are a few workshops you can book right now:"
          : "We currently don’t have workshops listed as active. Please check back soon or open the Workshops page.",
        workshopActions.length
          ? workshopActions
          : [
              {
                type: "book_workshop",
                label: "Open Workshops",
                data: { id: "workshops", type: "workshop" },
              },
            ],
      );

      return true;
    }

    // Products
    if (looksLikeProductQuery(userText)) {
      const category = categoryFromQuery(userText);

      let query = supabase.from("products").select("id, name, price, category");
      if (category) query = query.eq("category", category);

      const { data: products, error } = await query.limit(6);

      if (error) {
        console.error("Product fetch error:", error);
        pushAssistantMessage(
          "I can help you shop, but I couldn't load products right now. Please open the Products page and try again.",
          [
            {
              type: "view_product",
              label: "Open Products",
              data: { id: "", type: "product" },
            },
          ],
        );
        return true;
      }

      const list = (products as ProductLite[] | null | undefined) || [];
      const productActions: ChatAction[] = list.slice(0, 3).map((p) => ({
        type: "add_to_cart",
        label: `Add ${p.name} - ₹${p.price}`,
        data: { id: p.id, name: p.name, price: p.price, type: "product" },
      }));

      const heading = category
        ? `Here are some ${category.toLowerCase()} you can add to cart:`
        : "Here are some products you can add to cart:";

      pushAssistantMessage(
        list.length
          ? heading
          : "I couldn’t find matching products right now. Please open the Products page to browse.",
        list.length
          ? productActions
          : [
              {
                type: "view_product",
                label: "Open Products",
                data: { id: "", type: "product" },
              },
            ],
      );

      return true;
    }

    return false;
  };

  // Handle action buttons (Add to Cart, Book Workshop, etc.)
  const handleAction = async (action: ChatAction) => {
    switch (action.type) {
      case "add_to_cart":
        if (action.data.id && action.data.type === "product") {
          const { data: product } = await supabase
            .from("products")
            .select("id, name, price, image_url, weight_kg")
            .eq("id", action.data.id)
            .single();

          if (product) {
            await addToCart({
              productId: product.id,
              itemType: "product",
              product: product,
            });
            toast.success("Added to cart");
          }
        }
        break;

      case "book_workshop":
        if (action.data.id) {
          const { data: workshop } = await supabase
            .from("workshops")
            .select("id, title, price, image_url, duration")
            .eq("id", action.data.id)
            .single();

          if (workshop) {
            await addToCart({
              workshopId: workshop.id,
              itemType: "workshop",
              workshop: workshop,
            });
            toast.success("Workshop added to cart");
          }
        }
        break;

      case "book_experience":
        if (!user) {
          toast.error("Please sign in to book an experience");
          navigate("/auth?redirect=/experiences");
          setIsOpen(false);
          break;
        }
        navigate("/experiences");
        setIsOpen(false);
        break;

      case "view_product":
        if (action.data.id === "custom") {
          navigate("/products/custom");
          setIsOpen(false);
          break;
        }
        if (!action.data.id) {
          navigate("/products");
          setIsOpen(false);
          break;
        }
        navigate(`/products/${action.data.id}`);
        setIsOpen(false);
        break;
    }
  };

  // Parse AI response for actionable items
  const parseActionsFromResponse = async (
    responseText: string,
  ): Promise<ChatAction[]> => {
    const actions: ChatAction[] = [];

    // Check if response mentions products
    const productKeywords = [
      "mug",
      "bowl",
      "plate",
      "vase",
      "platter",
      "tea set",
      "pottery",
      "sculpture",
    ];
    const hasProductMention = productKeywords.some((keyword) =>
      responseText.toLowerCase().includes(keyword),
    );

    if (hasProductMention) {
      // Fetch products matching keywords
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price")
        .limit(3);

      products?.forEach((product) => {
        if (
          responseText
            .toLowerCase()
            .includes(product.name.toLowerCase().split(" ")[0])
        ) {
          actions.push({
            type: "add_to_cart",
            label: `Add ${product.name} - ₹${product.price}`,
            data: {
              id: product.id,
              name: product.name,
              price: product.price,
              type: "product",
            },
          });
        }
      });
    }

    // Check if response mentions workshops
    const workshopKeywords = [
      "workshop",
      "class",
      "pottery session",
      "wheel throwing",
      "beginner",
    ];
    const hasWorkshopMention = workshopKeywords.some((keyword) =>
      responseText.toLowerCase().includes(keyword),
    );

    if (hasWorkshopMention) {
      const { data: workshops } = await supabase
        .from("workshops")
        .select("id, title, price")
        .eq("is_active", true)
        .limit(3);

      workshops?.forEach((workshop) => {
        actions.push({
          type: "book_workshop",
          label: `Book ${workshop.title} - ₹${workshop.price}`,
          data: {
            id: workshop.id,
            name: workshop.title,
            price: workshop.price,
            type: "workshop",
          },
        });
      });
    }

    // Check if response mentions experiences
    const experienceKeywords = [
      "experience",
      "studio visit",
      "pottery date",
      "private session",
    ];
    const hasExperienceMention = experienceKeywords.some((keyword) =>
      responseText.toLowerCase().includes(keyword),
    );

    if (hasExperienceMention) {
      actions.push({
        type: "book_experience",
        label: "View Experiences",
        data: { id: "studio-visit" },
      });
    }

    return actions;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // First try to handle commerce intents locally (so it works even if AI is brand-only)
    try {
      const handled = await handleCommerceIntent(userMessage.content);
      if (handled) {
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error("Intent handling error:", e);
      // fall through to n8n
    }

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          action: "sendMessage",
          chatInput: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const responseText =
        data.output ||
        data.response ||
        data.message ||
        "I apologize, I couldn't process that request. Please try again.";

      // Parse actions from the response
      const actions = await parseActionsFromResponse(responseText);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        role: "assistant",
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'm having trouble connecting right now. Please try again in a moment.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const bounceVariants = {
    idle: { y: 0, rotate: 0 },
    bounce: {
      y: [0, -20, 0, -12, 0, -6, 0],
      rotate: [0, -5, 5, -3, 3, -1, 0],
      transition: {
        duration: 0.9,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-terracotta to-terracotta/80 text-cream shadow-warm hover:shadow-xl flex items-center justify-center border-2 border-cream/20"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        initial="idle"
        variants={bounceVariants}
        animate={triggerBounce ? "bounce" : "idle"}
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-7 h-7" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-28 right-6 z-50 w-[400px] h-[550px] min-h-0 bg-cream/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-sand/30 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-charcoal to-charcoal/95 text-cream flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-terracotta/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-terracotta" />
                </div>
                <div>
                  <h3 className="font-serif text-xl tracking-wide">
                    Bashō Assistant
                  </h3>
                  <p className="text-xs text-cream/60 font-light">
                    Ask about pottery & workshops
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-cream/10 rounded-full transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-cream/50 to-sand/20 overscroll-contain"
              data-lenis-prevent
              data-lenis-prevent-wheel
              data-lenis-prevent-touch
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-5 py-3 shadow-soft ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-terracotta to-terracotta/90 text-cream rounded-2xl rounded-br-sm"
                        : "bg-white/90 text-charcoal rounded-2xl rounded-bl-sm border border-sand/30"
                    }`}
                  >
                    <div
                      className="text-sm leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_code]:bg-charcoal/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2 [&_li]:my-1"
                      dangerouslySetInnerHTML={{
                        __html: formatMarkdown(message.content),
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 max-w-[85%]">
                      {message.actions.map((action, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                          onClick={() => handleAction(action)}
                          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-terracotta to-terracotta/90 text-cream text-xs rounded-lg shadow-warm hover:shadow-xl hover:from-terracotta/90 hover:to-terracotta/80 transition-all duration-200"
                        >
                          {action.type === "add_to_cart" && (
                            <ShoppingBag className="w-3 h-3" />
                          )}
                          {action.type === "book_workshop" && (
                            <Calendar className="w-3 h-3" />
                          )}
                          {action.type === "book_experience" && (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>{action.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/90 text-charcoal px-5 py-4 rounded-2xl rounded-bl-sm border border-sand/30 shadow-soft">
                    <div className="flex items-center gap-1.5">
                      <motion.span
                        className="w-2 h-2 bg-terracotta rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0,
                        }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-terracotta rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.15,
                        }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-terracotta rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.3,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-sand/30 bg-white/80 backdrop-blur-sm">
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about our pottery..."
                  className="flex-1 bg-cream/50 border-sand/40 focus:border-terracotta/50 focus:ring-terracotta/20 rounded-xl py-5 px-4 text-charcoal placeholder:text-charcoal/40"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-to-br from-terracotta to-terracotta/90 hover:from-terracotta/90 hover:to-terracotta/80 text-cream shrink-0 w-12 h-12 rounded-xl shadow-warm transition-all duration-200"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-charcoal/40 text-center mt-3 font-light">
                Powered by Bashō AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
