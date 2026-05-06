import { AIDoctorAgents } from '@/shared/list'
import React from 'react'
import DoctorAgentCard from './DoctorAgentCard'

/**
 * DoctorsAgentList Component
 * Displays a responsive grid of AI-powered doctor agent cards.
 */
function DoctorsAgentList() {
    return (
        <div className='mt-8 md:mt-10'>
            {/* Section Title */}
            <div className='mb-5'>
                <h2 className='font-bold text-lg sm:text-xl'>AI Specialist Doctors</h2>
                <p className='text-sm text-muted-foreground mt-0.5'>Choose a specialist to start your voice consultation</p>
            </div>

            {/* Responsive grid: 1 col mobile → 2 col sm → 3 col md → 4 col lg → 5 col xl */}
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6'>
                {AIDoctorAgents.map((doctor, index) => (
                    <DoctorAgentCard key={index} doctorAgent={doctor} />
                ))}
            </div>
        </div>
    )
}

export default DoctorsAgentList
