"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import ButtonAccount from "@/components/ButtonAccount";
import Image from "next/image";
import IconImage from "@/app/apple-icon.png";
import Link from "next/link";

export default function Menubar() {
  const pathname = usePathname();

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start p-2 gap-3">
      <h1 className="text-lg md:text-xl font-extrabold pt-2">Corset Tracker</h1>
      
      <div className="flex items-center gap-6 md:gap-6 bg-[#2e373f] py-2 md:py-3 px-4 md:px-8 rounded-lg w-full sm:w-auto justify-center">
        <Link 
          href="/dashboard" 
          className={`font-medium transition-colors duration-200 text-lg md:text-base ${
            isActive('/dashboard') ? 'text-primary' : 'text-base-content hover:text-gray-300'
          }`}
        >
          Check day
        </Link>
        <Link 
          href="/this-month" 
          className={`font-medium transition-colors duration-200 text-lg md:text-base ${
            isActive('/this-month') ? 'text-primary' : 'text-base-content hover:text-gray-300'
          }`}
        >
          This Month
        </Link>
        <Link 
          href="/progress" 
          className={`font-medium transition-colors duration-200 text-lg md:text-base ${
            isActive('/progress') ? 'text-primary' : 'text-base-content hover:text-gray-300'
          }`}
        >
          Progress
        </Link>
      </div>
      
      <div className="w-full sm:w-auto flex justify-center">
        <ButtonAccount />
      </div>
    </div>
  );
}
