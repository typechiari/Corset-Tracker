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
    <div className="flex justify-between items-start p-2">
      {/* <div className="flex justify-center items-center gap-2">
        <Image
            src={IconImage}
            alt="Product Demo"
            className="w-1/6"
            priority={true}
            width={100}
            height={100}
          />*/}
        <h1 className="text-xl md:text-xl font-extrabold pt-2">Corset Tracker</h1>
      {/*</div>*/}
      <div className="flex items-center gap-6 bg-[#2e373f] py-3 px-8 rounded-lg">
        <Link 
          href="/dashboard" 
          className={`font-medium transition-colors duration-200 ${
            isActive('/dashboard') ? 'text-primary' : 'text-base-content hover:text-gray-300'
          }`}
        >
          Check day
        </Link>
        <Link 
          href="/this-month" 
          className={`font-medium transition-colors duration-200 ${
            isActive('/this-month') ? 'text-primary' : 'text-base-content hover:text-gray-300'
          }`}
        >
          This Month
        </Link>
        <Link 
          href="/progress" 
          className={`font-medium transition-colors duration-200 ${
            isActive('/progress') ? 'text-primary' : 'text-base-content hover:text-gray-300'
          }`}
        >
          Progress
        </Link>
      </div>
      <ButtonAccount />
    </div>
  );
}
