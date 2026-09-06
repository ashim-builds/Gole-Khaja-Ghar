import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogIn,
  Bell,
  Plus,
  Edit,
  ToggleLeft,
  Star,
  Upload,
  Tag,
  Weight,
  Layers,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
} from "lucide-react";

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  content: React.ReactNode;
}

function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-black">
        {number}
      </div>
      <div className="flex-1 text-stone-700 font-medium leading-relaxed pt-1">
        {children}
      </div>
    </div>
  );
}

function Tip({
  type = "tip",
  children,
}: {
  type?: "tip" | "warn" | "info" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    tip: {
      bg: "bg-orange-50 border-orange-200",
      icon: <Zap className="w-4 h-4 text-primary" />,
      label: "Tip",
      text: "text-orange-900",
    },
    warn: {
      bg: "bg-red-50 border-red-200",
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      label: "Warning",
      text: "text-red-800",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: <Info className="w-4 h-4 text-blue-500" />,
      label: "Note",
      text: "text-blue-800",
    },
    success: {
      bg: "bg-green-50 border-green-200",
      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      label: "Good to know",
      text: "text-green-800",
    },
  };
  const s = styles[type];
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${s.bg}`}>
      <span className="flex-shrink-0 mt-0.5">{s.icon}</span>
      <p className={`text-sm font-medium ${s.text}`}>
        <strong>{s.label}: </strong>
        {children}
      </p>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold ${color}`}>
      {label}
    </span>
  );
}

function FieldRow({
  field,
  desc,
  required,
}: {
  field: string;
  desc: string;
  required?: boolean;
}) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-stone-100 last:border-0 items-start">
      <div className="w-40 flex-shrink-0">
        <code className="text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
          {field}
        </code>
        {required && (
          <span className="ml-1.5 text-[10px] font-bold text-red-500 uppercase">
            req
          </span>
        )}
      </div>
      <p className="text-sm text-stone-600">{desc}</p>
    </div>
  );
}

export default function AdminGuidePage() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sections: Section[] = [
    {
      id: "login",
      icon: <LogIn className="w-5 h-5" />,
      title: "Logging In",
      color: "blue",
      content: (
        <div className="space-y-6">
          <p className="text-stone-600 leading-relaxed">
            The admin panel is protected behind a password. Only authorised staff can access it. Navigate to{" "}
            <code className="bg-stone-100 px-1.5 py-0.5 rounded text-sm font-bold text-stone-800">
              /admin/login
            </code>{" "}
            and enter your credentials.
          </p>

          <div className="space-y-4">
            <Step number={1}>
              Open your browser and go to <strong>/admin/login</strong>.
            </Step>
            <Step number={2}>
              Type the <strong>Admin Password</strong> into the password field.
            </Step>
            <Step number={3}>
              Click <strong>"Login to Dashboard"</strong>. You will be redirected to the main dashboard if the password is correct.
            </Step>
          </div>

          <Tip type="warn">
            Never share your admin password. If you suspect the password has been compromised, update the{" "}
            <code className="bg-red-100 px-1 rounded text-xs font-bold">
              ADMIN_PASSWORD
            </code>{" "}
            environment variable immediately.
          </Tip>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-2">
            <p className="text-sm font-black text-stone-800">How to log out:</p>
            <p className="text-sm text-stone-600">
              Click the <strong>Logout</strong> button at the bottom of the sidebar (desktop) or inside the mobile menu. You will be returned to the login page and your session will be cleared.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      title: "Dashboard Overview",
      color: "purple",
      content: (
        <div className="space-y-6">
          <p className="text-stone-600 leading-relaxed">
            The Dashboard is your command centre. It shows live business metrics and a feed of the most recent orders — all updating in real time without needing a page refresh.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Products",
                desc: "All products in the database",
                color: "bg-blue-50 text-blue-600 border-blue-100",
              },
              {
                label: "Available",
                desc: "Products currently in stock",
                color: "bg-green-50 text-green-600 border-green-100",
              },
              {
                label: "Total Orders",
                desc: "All orders ever placed",
                color: "bg-purple-50 text-purple-600 border-purple-100",
              },
              {
                label: "Pending",
                desc: "Orders awaiting action",
                color: "bg-orange-50 text-orange-600 border-orange-100",
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`p-4 rounded-xl border ${card.color}`}
              >
                <p className="text-xs font-black uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-xs mt-1 opacity-70">{card.desc}</p>
              </div>
            ))}
          </div>

          <Tip type="info">
            The <strong>Pending Orders</strong> card pulses red when there are unprocessed orders. Act on these quickly to keep customers happy!
          </Tip>

          <div className="space-y-4">
            <h3 className="font-black text-stone-800">Recent Orders Table</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Below the metric cards is a live-updating table showing recent orders. Click any{" "}
              <strong className="text-primary">order number</strong> link to open that order's detail page, or click{" "}
              <strong>"View All"</strong> to go to the full orders list.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "products",
      icon: <Package className="w-5 h-5" />,
      title: "Managing Products",
      color: "green",
      content: (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-black text-stone-800 text-lg border-b border-stone-100 pb-2">
              📋 Products List
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Navigate to <strong>Products</strong> in the sidebar to see all your products. Each row shows the product image, name, category, price, stock status, whether it is featured, and an edit button.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-stone-800 text-lg border-b border-stone-100 pb-2">
              <ToggleLeft className="inline w-5 h-5 mr-2 text-primary" />
              Quick Stock Toggle
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              You can switch any product between <strong>In Stock</strong> and <strong>Out of Stock</strong> directly from the products list without opening the edit page. Just click the toggle in the <strong>Stock</strong> column.
            </p>
            <Tip>
              Use this to quickly mark a product as unavailable when it runs out of stock, so customers cannot add it to their cart.
            </Tip>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-stone-800 text-lg border-b border-stone-100 pb-2">
              <Plus className="inline w-5 h-5 mr-2 text-primary" />
              Adding a New Product
            </h3>
            <div className="space-y-3">
              <Step number={1}>
                <strong>Basic Information</strong> — Enter the product name, description, and select a category.
              </Step>
              <Step number={2}>
                <strong>Pricing Structure</strong> — Choose By Weight (per Kg) or By Variant.
              </Step>
              <Step number={3}>
                <strong>Product Images</strong> — Upload a cover photo and optional gallery images.
              </Step>
              <Step number={4}>
                <strong>Status</strong> — Toggle Available and Featured.
              </Step>
              <Step number={5}>
                Click <strong>"Create Product"</strong> to save.
              </Step>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "orders",
      icon: <ShoppingCart className="w-5 h-5" />,
      title: "Managing Orders",
      color: "orange",
      content: (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-black text-stone-800 text-lg border-b border-stone-100 pb-2">
              🏷️ Order Status Flow
            </h3>
            <div className="space-y-3">
              {[
                {
                  status: "pending",
                  color: "bg-orange-100 text-orange-600",
                  desc: "New order waiting for confirmation.",
                },
                {
                  status: "confirmed",
                  color: "bg-blue-100 text-blue-600",
                  desc: "Order acknowledged by admin.",
                },
                {
                  status: "preparing",
                  color: "bg-blue-100 text-blue-600",
                  desc: "Order is being cooked/packed.",
                },
                {
                  status: "ready",
                  color: "bg-blue-100 text-blue-600",
                  desc: "Ready for pickup or out for delivery.",
                },
                {
                  status: "delivered",
                  color: "bg-green-100 text-green-600",
                  desc: "Successfully delivered or collected.",
                },
                {
                  status: "cancelled",
                  color: "bg-red-100 text-red-600",
                  desc: "Cancelled order.",
                },
              ].map((s) => (
                <div
                  key={s.status}
                  className="flex items-start gap-4 py-2 border-b border-stone-100 last:border-0"
                >
                  <Badge label={s.status} color={s.color} />
                  <p className="text-sm text-stone-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "notifications",
      icon: <Bell className="w-5 h-5" />,
      title: "Push Notifications",
      color: "orange",
      content: (
        <div className="space-y-6">
          <p className="text-stone-600 leading-relaxed">
            Gole Khaja Ghar features native web push notifications that keep you updated instantly on new orders and status updates, even when your browser is minimized!
          </p>
          <div className="space-y-4">
            <Step number={1}>
              Locate the <strong>Bell Icon</strong> in the admin sidebar.
            </Step>
            <Step number={2}>
              Click <strong>"Subscribe Now"</strong> inside the popup settings box.
            </Step>
            <Step number={3}>
              Click <strong>"Allow"</strong> when the browser prompts for permission.
            </Step>
          </div>
        </div>
      ),
    },
  ];

  const faqs = [
    {
      q: "How do I quickly mark a product out of stock?",
      a: "From the Products list, find the product and click the Stock toggle in the Stock column. It switches instantly without opening the edit page.",
    },
    {
      q: "A customer placed an order — what do I do first?",
      a: "Open the Orders page. Click the eye icon on the new order to see customer details, items, and delivery address. Change status to 'Confirmed'.",
    },
    {
      q: "Can I call the customer directly from the admin panel?",
      a: "Yes. On the order detail page, under Customer Details, click the 'Call' link next to their phone number.",
    },
  ];

  const activeData = sections.find((s) => s.id === activeSection)!;

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-stone-900">Admin Guide</h1>
          <p className="text-stone-500 text-sm font-medium">
            Everything you need to know to manage Gole Khaja Ghar
          </p>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        <nav className="lg:w-56 flex-shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                id={`guide-nav-${section.id}`}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all w-full whitespace-nowrap text-left cursor-pointer ${
                  isActive
                    ? "bg-[#111111] text-white shadow-md"
                    : "bg-white text-stone-500 border border-stone-100 hover:border-stone-200 hover:text-stone-800"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive
                      ? colorMap[section.color] + " text-white"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {section.icon}
                </span>
                <span className="hidden lg:block">{section.title}</span>
                <span className="lg:hidden">{section.title.split(" ")[0]}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
              <div
                className={`w-10 h-10 ${colorMap[activeData.color]} text-white rounded-xl flex items-center justify-center`}
              >
                {activeData.icon}
              </div>
              <h2 className="text-2xl font-black text-stone-900">
                {activeData.title}
              </h2>
            </div>
            {activeData.content}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 md:p-8">
        <h2 className="text-2xl font-black text-stone-900 mb-6 flex items-center gap-3">
          <span className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center text-lg font-black">
            ?
          </span>
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isOpen ? "border-primary" : "border-stone-200"
                }`}
              >
                <button
                  id={`guide-faq-${i}`}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-stone-800 hover:bg-stone-50 transition-colors cursor-pointer"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                >
                  <span className="pr-4">{faq.q}</span>
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-stone-600 text-sm leading-relaxed border-t border-stone-100 pt-3 bg-orange-50/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
