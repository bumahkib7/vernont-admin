"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Star,
  Archive,
  Trash2,
  Tag,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Inbox,
  Users,
} from "lucide-react";
import Link from "next/link";

// Mock data
const conversations = [
  {
    id: "conv-1",
    customer: {
      id: "CUS-001",
      name: "Olivia Martin",
      email: "olivia@example.com",
      avatar: "",
    },
    subject: "Question about Hermès Birkin authentication",
    lastMessage: "Thank you for the quick response! I'll proceed with the order.",
    lastMessageTime: "2024-01-15T14:30:00Z",
    unread: true,
    status: "open",
    priority: "normal",
    orderId: "ORD-001",
  },
  {
    id: "conv-2",
    customer: {
      id: "CUS-002",
      name: "Jackson Lee",
      email: "jackson@example.com",
      avatar: "",
    },
    subject: "Shipping delay inquiry",
    lastMessage: "I was expecting my package yesterday but it hasn't arrived yet.",
    lastMessageTime: "2024-01-15T12:15:00Z",
    unread: true,
    status: "pending",
    priority: "high",
    orderId: "ORD-002",
  },
  {
    id: "conv-3",
    customer: {
      id: "CUS-003",
      name: "Isabella Nguyen",
      email: "isabella@example.com",
      avatar: "",
    },
    subject: "Return request for Louis Vuitton bag",
    lastMessage: "I've attached the photos of the item as requested.",
    lastMessageTime: "2024-01-14T18:45:00Z",
    unread: false,
    status: "open",
    priority: "normal",
    orderId: "ORD-003",
  },
  {
    id: "conv-4",
    customer: {
      id: "CUS-004",
      name: "William Kim",
      email: "will@example.com",
      avatar: "",
    },
    subject: "Payment issue with order",
    lastMessage: "My card was declined even though I have sufficient funds.",
    lastMessageTime: "2024-01-14T10:20:00Z",
    unread: false,
    status: "resolved",
    priority: "normal",
    orderId: null,
  },
  {
    id: "conv-5",
    customer: {
      id: "CUS-005",
      name: "Sofia Davis",
      email: "sofia@example.com",
      avatar: "",
    },
    subject: "Product availability question",
    lastMessage: "When will the Dior Saddle Bag be back in stock?",
    lastMessageTime: "2024-01-13T16:30:00Z",
    unread: false,
    status: "resolved",
    priority: "normal",
    orderId: null,
  },
];

const selectedConversationMessages = [
  {
    id: "msg-1",
    sender: "customer",
    content: "Hi, I'm interested in purchasing the Hermès Birkin 25 but I have a few questions about the authentication process. Can you tell me more about how you verify the authenticity of your products?",
    timestamp: "2024-01-15T10:00:00Z",
  },
  {
    id: "msg-2",
    sender: "admin",
    content: "Hello Olivia! Thank you for your interest in our Hermès Birkin 25. We take authentication very seriously at Vernont.\n\nAll our products go through a rigorous 3-step authentication process:\n\n1. Initial inspection by our in-house experts\n2. Detailed examination of materials, stitching, and hardware\n3. Documentation verification (receipts, certificates when available)\n\nWe also work with Entrupy for digital authentication on high-value items. Each product comes with a certificate of authenticity.",
    timestamp: "2024-01-15T10:15:00Z",
  },
  {
    id: "msg-3",
    sender: "customer",
    content: "That's very reassuring! What's your return policy if I'm not satisfied with the product?",
    timestamp: "2024-01-15T11:30:00Z",
  },
  {
    id: "msg-4",
    sender: "admin",
    content: "Great question! We offer a 14-day return policy for all purchases. If you're not completely satisfied with your item, you can return it in its original condition for a full refund.\n\nFor items over $5,000, we also offer a 48-hour inspection period where you can have the item authenticated by your own expert at no additional cost.\n\nShall I reserve the Birkin 25 for you while you decide?",
    timestamp: "2024-01-15T11:45:00Z",
  },
  {
    id: "msg-5",
    sender: "customer",
    content: "Thank you for the quick response! I'll proceed with the order.",
    timestamp: "2024-01-15T14:30:00Z",
  },
];

const messageStats = [
  { label: "Open", value: 12, icon: Inbox, color: "text-blue-600" },
  { label: "Pending", value: 5, icon: Clock, color: "text-yellow-600" },
  { label: "Resolved", value: 156, icon: CheckCircle, color: "text-green-600" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    case "resolved":
      return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high":
      return <Badge variant="outline" className="border-red-500 text-red-600">High</Badge>;
    case "normal":
      return null;
    case "low":
      return <Badge variant="outline" className="border-gray-500 text-gray-600">Low</Badge>;
    default:
      return null;
  }
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${Math.floor(hours)}h ago`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function formatMessageTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Sidebar - Conversation List */}
      <div className="w-[380px] flex-shrink-0 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 px-4 py-3 border-b">
          {messageStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-sm font-medium">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                  selectedConversation?.id === conversation.id ? "bg-muted" : ""
                }`}
              >
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={conversation.customer.avatar} />
                    <AvatarFallback className="bg-muted">
                      {getInitials(conversation.customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium truncate ${conversation.unread ? "text-foreground" : "text-muted-foreground"}`}>
                        {conversation.customer.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conversation.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {conversation.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(conversation.status)}
                      {getPriorityBadge(conversation.priority)}
                      {conversation.orderId && (
                        <Badge variant="outline" className="text-xs">
                          {conversation.orderId}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {conversation.unread && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Conversation View */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Conversation Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation.customer.avatar} />
                <AvatarFallback className="bg-muted">
                  {getInitials(selectedConversation.customer.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/customers/${selectedConversation.customer.id}`}
                    className="font-medium hover:underline"
                  >
                    {selectedConversation.customer.name}
                  </Link>
                  {getStatusBadge(selectedConversation.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.customer.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedConversation.orderId && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/orders/${selectedConversation.orderId}`}>
                    View Order
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <Star className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Tag className="mr-2 h-4 w-4" />
                    Add Tag
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Resolved
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Subject */}
              <div className="text-center py-4">
                <h2 className="font-medium">{selectedConversation.subject}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Started on {new Date(selectedConversationMessages[0].timestamp).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Messages */}
              {selectedConversationMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === "admin" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {message.sender === "customer" ? (
                      <>
                        <AvatarImage src={selectedConversation.customer.avatar} />
                        <AvatarFallback className="bg-muted text-xs">
                          {getInitials(selectedConversation.customer.name)}
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        G
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className={`flex-1 max-w-[70%] ${message.sender === "admin" ? "text-right" : ""}`}>
                    <div
                      className={`inline-block rounded-lg px-4 py-2 text-sm ${
                        message.sender === "admin"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-left">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Reply Input */}
          <div className="p-4 border-t">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  placeholder="Type your reply..."
                  className="min-h-[80px] resize-none"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Save as Draft
                  </Button>
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </div>
                <Button disabled={!replyText.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a conversation to view</p>
          </div>
        </div>
      )}
    </div>
  );
}
