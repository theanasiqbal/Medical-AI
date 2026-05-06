import React from 'react'
import { doctorAgent } from './DoctorAgentCard'
import Image from 'next/image'

type props = {
    doctorAgent: doctorAgent,
    setSelectedDoctor: (doctor: doctorAgent) => void,
    selectedDoctor: doctorAgent
}

/**
 * SuggestedDoctorCard Component
 * Clickable card for a suggested doctor; highlights when selected.
 */
function SuggestedDoctorCard({ doctorAgent, setSelectedDoctor, selectedDoctor }: props) {
    const isSelected = selectedDoctor?.id === doctorAgent?.id;

    return (
        <div
            className={`flex flex-col items-center border rounded-2xl shadow-sm p-3 sm:p-4 cursor-pointer transition-all duration-200
                hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5
                ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
                    : 'border-border bg-card'
                }`}
            onClick={() => setSelectedDoctor(doctorAgent)}
        >
            {/* Doctor image */}
            <Image
                src={doctorAgent?.image}
                alt={doctorAgent?.specialist}
                width={70}
                height={70}
                className='w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-border'
            />

            {/* Name */}
            <h2 className='font-bold text-xs sm:text-sm text-center mt-2 leading-tight'>
                {doctorAgent?.specialist}
            </h2>

            {/* Description */}
            <p className='text-[10px] sm:text-xs text-center text-muted-foreground line-clamp-2 mt-1'>
                {doctorAgent?.description}
            </p>

            {isSelected && (
                <span className='mt-2 text-[10px] font-semibold text-blue-600 uppercase tracking-wide'>
                    ✓ Selected
                </span>
            )}
        </div>
    )
}

export default SuggestedDoctorCard
