"use client";

import Link from "next/link";
import { useFooterSettings } from "@/hooks/use-footer-settings";
import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

export function Footer() {
  const { settings, loading } = useFooterSettings();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : data.data || [];
        setCategories(
          all.filter(
            (c: Category) =>
              !c.parent_id &&
              c.name.toLowerCase() !== "uncategorized" &&
              c.slug.toLowerCase() !== "uncategorized"
          )
        );
      })
      .catch(() => setCategories([]));
  }, []);
  
  return (
    <footer className="bg-[#03052b] text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-6 pt-16 pb-0">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-1">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-6">
              Categories
            </h4>
            <ul className="space-y-3 list-none">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-6">
              Shop
            </h4>
             <ul className="space-y-3 list-none">
               {!loading && settings.shopLinks.map((link, index) => (
                 <li key={index}>
                   <Link href={link.url} className="text-sm text-neutral-400 hover:text-white transition-colors">
                     {link.label}
                   </Link>
                 </li>
               ))}
             </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-6">
              About
            </h4>
             <ul className="space-y-3 list-none">
               {!loading && settings.aboutLinks.map((link, index) => (
                 <li key={index}>
                   <Link href={link.url} className="text-sm text-neutral-400 hover:text-white transition-colors">
                     {link.label}
                   </Link>
                 </li>
               ))}
             </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-6">
              Help
            </h4>
             <ul className="space-y-3 list-none">
               {!loading && settings.helpLinks.map((link, index) => (
                 <li key={index}>
                   <Link href={link.url} className="text-sm text-neutral-400 hover:text-white transition-colors">
                     {link.label}
                   </Link>
                 </li>
               ))}
             </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-6">
              Connect With Us
            </h4>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border border-neutral-700 hover:border-white hover:text-white text-neutral-400 transition-colors"
                aria-label="Instagram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border border-neutral-700 hover:border-white hover:text-white text-neutral-400 transition-colors"
                aria-label="X (Twitter)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border border-neutral-700 hover:border-white hover:text-white text-neutral-400 transition-colors"
                aria-label="Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border border-neutral-700 hover:border-white hover:text-white text-neutral-400 transition-colors"
                aria-label="YouTube"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border border-neutral-700 hover:border-white hover:text-white text-neutral-400 transition-colors"
                aria-label="Pinterest"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border border-neutral-700 hover:border-white hover:text-white text-neutral-400 transition-colors"
                aria-label="TikTok"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              <a
                href="https://snapchat.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border border-neutral-700 hover:border-white hover:text-white text-neutral-400 transition-colors"
                aria-label="Snapchat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 3.702 1.08.06 1.95-.359 2.588-1.105.165-.18.315-.36.435-.523.271-.375.674-.586 1.053-.57.29.015.555.12.765.301.36.316.479.659.57 1.075.089.376.03.779-.165 1.261-.36.87-1.063 1.6-1.98 2.045-1.513.735-3.363.63-5.585-.27-.03.165-.075.33-.135.51-.75 2.115-2.728 3.375-4.814 3.375H8.82c-2.085 0-4.064-1.26-4.813-3.374-.061-.18-.106-.345-.136-.51-2.222.899-4.071 1.004-5.584.27-.916-.446-1.62-1.175-1.98-2.045-.196-.481-.255-.885-.165-1.261.09-.416.21-.759.57-1.075.21-.18.476-.286.765-.301.379-.015.783.195 1.054.57.12.163.27.344.435.523.638.746 1.508 1.166 2.588 1.105 3.265-.226 4.73-3.565 4.791-3.701l.015-.016c.18-.343.21-.644.12-.868-.195-.45-.884-.675-1.334-.81-.134-.044-.254-.09-.344-.119-.823-.33-1.228-.72-1.213-1.168.001-.359.285-.689.735-.838.151-.061.328-.09.51-.09.12 0 .299.015.463.104.375.18.735.285 1.034.3.198 0 .33-.045.405-.09-.008-.165-.018-.33-.03-.51l-.004-.06c-.104-1.628-.23-3.654.3-4.847C7.178 1.07 10.535.794 11.524.794h.682z"/>
                </svg>
              </a>
              <a
                href="https://threads.net"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border border-neutral-700 hover:border-white hover:text-white text-neutral-400 transition-colors"
                aria-label="Threads"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.415-2.25 1.348-3.04.768-.646 1.583-.928 3.13-.98.29-.009.59-.002.89.019.949.07 1.785.394 2.484.963.573.468.969 1.099 1.173 1.875.096.36.15.725.176 1.09.008-.012.015-.024.023-.036.292-.46.467-.966.508-1.475.06-.77-.154-1.448-.648-2.032-.507-.6-1.305-.93-2.19-.907-1.411.037-2.655.725-3.405 1.887-.488.758-.68 1.615-.564 2.545.09.713.35 1.38.76 1.99.25.37.557.72.92 1.045-.026.09-.05.182-.074.274-.16.588-.247 1.203-.255 1.833-.012.885.104 1.793.346 2.705.49 1.84 1.92 3.41 3.877 4.252 1.17.502 2.45.726 3.79.667 1.174-.053 2.287-.38 3.304-.972 3.905-2.28 4.085-6.002 4.037-8.943-.012-.723-.072-1.408-.184-2.05l.02-.009c.08-.367.125-.72.136-1.054.017-.522-.073-.985-.278-1.38-.28-.54-.778-.875-1.517-.97-.473-.06-.975.01-1.44.206-.302.128-.575.296-.8.483-.1.085-.19.168-.26.249l-.003-.004c-.001 0-.002 0-.003-.001-.008.023-.017.046-.025.07-.045.127-.09.259-.136.408-.232.747-.485 1.588-.757 2.482-.98 3.22-2.19 6.174-3.612 8.79-1.7 3.127-3.687 5.025-5.91 5.655-1.02.29-2.14.423-3.406.423l-.008-.001zm.38-5.615c1.034.534 2.15.768 3.33.697 1.18-.07 2.15-.438 2.896-1.093 1.17-1.028 1.06-2.47.9-3.625-.052-.373-.128-.742-.22-1.096-.31.21-.63.393-.96.547-.72.333-1.51.5-2.354.5-1.278 0-2.295-.352-3.068-1.057-.75-.686-1.14-1.58-1.137-2.623.002-.857.26-1.635.75-2.296.52-.703 1.29-1.14 2.21-1.27.35-.05.71-.07 1.07-.07.8-.01 1.62.13 2.44.43 1.1.39 2.03 1.1 2.69 2.05.56.82.9 1.77.98 2.82.05.66-.01 1.28-.19 1.89-.17.61-.49 1.19-.94 1.73-.33.4-.74.78-1.23 1.13-.63.46-1.33.82-2.09 1.08-.91.31-1.87.46-2.87.43-1.27-.03-2.41-.32-3.42-.85-1.11-.59-1.96-1.42-2.53-2.45-.6-1.08-.83-2.27-.68-3.53.13-1.12.54-2.09 1.22-2.9.9-1.06 2.22-1.65 3.87-1.72 1.08-.05 2.09.19 2.92.7.79.48 1.37 1.15 1.7 1.94.14.34.24.7.3 1.08.09.59.08 1.16-.04 1.72-.03.16-.08.32-.13.49-.03.11-.06.22-.09.33-.09-.12-.17-.24-.26-.36-.63-.89-1.5-1.66-2.58-2.27-1.19-.67-2.55-1.02-4.05-.99-1.01.02-1.94.18-2.78.5-2.26.87-3.89 2.62-4.65 4.8-.56 1.6-.65 3.3-.28 5.1.63 3.08 2.68 5.32 5.58 6.08.76.2 1.55.3 2.34.3 1.34 0 2.67-.28 3.98-.84 1.56-.66 2.86-1.58 3.88-2.74 1.07-1.21 1.97-2.68 2.67-4.38.43-1.04.77-2.01 1.03-2.88.12-.42.23-.81.31-1.17.03-.13.05-.25.07-.36l.02-.09c.03-.12.04-.2.04-.2.05-.31.09-.59.11-.82.02-.27.03-.48.02-.64-.01-.19-.05-.29-.05-.29-.12-.27-.3-.42-.58-.5-.23-.07-.49-.06-.79.01-.18.05-.37.13-.55.25-.18.11-.35.26-.5.43-.27.3-.44.6-.51.87z"/>
                </svg>
              </a>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500">
                Download Our App
              </p>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 border border-neutral-700 hover:border-neutral-500 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[8px] uppercase text-neutral-500 leading-none ">Get it on</p>
                  <p className="text-sm text-white leading-none ">Google Play</p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 border border-neutral-700 hover:border-neutral-500 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[8px] uppercase text-neutral-500 leading-none ">Download on the</p>
                  <p className="text-sm text-white leading-none ">App Store</p>
                </div>
              </a>
            </div>

          </div>
        </div>

        <div className="border-t border-neutral-800 mt-16 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {!loading && settings.bottomLinks.map((link, index) => (
                <Link key={index} href={link.url} className="text-xs text-neutral-500 hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500">
              © {new Date().getFullYear()} AAA Orange. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
