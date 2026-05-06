import React from 'react'
import AppHeader from './_components/AppHeader';

function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className='min-h-screen bg-background'>
            <AppHeader />
            <div className='px-4 sm:px-6 md:px-12 lg:px-20 xl:px-40 py-6 md:py-10'>
                {children}
            </div>
        </div>
    )
}

export default DashboardLayout