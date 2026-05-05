"use client"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'
import { IconArrowRight } from '@tabler/icons-react'
import axios from 'axios'
import { Loader2Icon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

/**
 * Type definition for each doctor agent card
 */
export type doctorAgent = {
    id: number,
    specialist: string,
    description: string,
    image: string,
    agentPrompt: string,
    voiceId?: string,
    subscriptionRequired: boolean
}

type props = {
    doctorAgent: doctorAgent
}

/**
 * DoctorAgentCard Component
 * Renders a doctor card with image, name, description,
 * and a button to start a new consultation session.
 */
function DoctorAgentCard({ doctorAgent }: props) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { has } = useAuth();

    // ✅ Check if the user has a 'pro' plan using Clerk's has() helper
    //@ts-ignore
    const paidUser = has && has({ plan: 'pro' });

    /**
     * 📞 Handle Start Consultation Button Click
     * Creates a new session with the selected doctor and redirects to the session page.
     */
    const onStartConsultation = async () => {
        setLoading(true);

        // Post the new session to backend API
        const result = await axios.post('/api/session-chat', {
            notes: 'New Query',
            selectedDoctor: doctorAgent
        });

        if (result.data?.sessionId) {
            // Navigate to the new session page
            router.push('/dashboard/medical-agent/' + result.data.sessionId);
        }

        setLoading(false);
    }

    return (
        <div className='relative'>
            {/* 🔒 Premium badge if doctor requires subscription */}
            {doctorAgent.subscriptionRequired && (
                <Badge className='absolute m-2 right-0'>Premium</Badge>
            )}

            {/* 👨‍⚕️ Doctor image */}
            <Image
                src={doctorAgent.image}
                alt={doctorAgent.specialist}
                width={200}
                height={300}
                className='w-full h-[230px] object-cover rounded-xl'
            />

            {/* 🩺 Specialist title */}
            <h2 className='font-bold mt-1'>{doctorAgent.specialist}</h2>

            {/* 📋 Doctor description */}
            <p className='line-clamp-2 text-sm text-gray-500'>
                {doctorAgent.description}
            </p>

            {/* 🚀 Start consultation button */}
            <Button
                className='w-full mt-2'
                onClick={onStartConsultation}
                disabled={loading} 
            >
                Start Consultation{' '}
                {loading ? (
                    <Loader2Icon className='animate-spin' />
                ) : (
                    <IconArrowRight />
                )}
            </Button>
        </div>
    )
}

export default DoctorAgentCard
