"use client"
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'

const menuOptions = [
    {
        id: 1,
        name: 'Home',
        path: '/dashboard'
    },
    {
        id: 2,
        name: 'History',
        path: '/dashboard/history'
    },
    {
        id: 3,
        name: 'Pricing',
        path: '/dashboard/billing'
    },
    {
        id: 4,
        name: 'Profile',
        path: '/profile'
    }
]

function AppHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className='relative z-50'>
            <div className='flex items-center justify-between p-3 sm:p-4 shadow-sm px-4 sm:px-8 md:px-20 lg:px-40 border-b border-border/60 bg-background/95 backdrop-blur-sm'>
                {/* Logo */}
                <Link href="/dashboard">
                    <Image
                        src={'/logo.png'}
                        alt='logo'
                        width={180}
                        height={90}
                        className='w-24 sm:w-32 md:w-44 h-auto'
                    />
                </Link>

                {/* Desktop Navigation */}
                <div className='hidden md:flex gap-8 lg:gap-12 items-center'>
                    {menuOptions.map((option) => (
                        <Link key={option.id} href={option.path}>
                            <span className='text-sm font-medium text-muted-foreground hover:text-foreground hover:font-semibold cursor-pointer transition-all duration-200'>
                                {option.name}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Right side: User + Hamburger */}
                <div className='flex items-center gap-3'>
                    <UserButton />
                    {/* Hamburger button — mobile & tablet only */}
                    <button
                        className='md:hidden p-2 rounded-lg hover:bg-secondary transition-colors'
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label='Toggle mobile menu'
                    >
                        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile / Tablet Dropdown Menu */}
            {mobileMenuOpen && (
                <div className='md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg z-40 animate-in slide-in-from-top-2 duration-200'>
                    <nav className='flex flex-col py-2'>
                        {menuOptions.map((option) => (
                            <Link
                                key={option.id}
                                href={option.path}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className='px-6 py-3.5 hover:bg-secondary transition-colors text-sm font-medium border-b border-border/30 last:border-0'>
                                    {option.name}
                                </div>
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </div>
    )
}

export default AppHeader