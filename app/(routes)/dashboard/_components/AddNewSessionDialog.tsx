"use client"
import React, { useEffect, useState } from 'react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight, Loader2, Stethoscope } from 'lucide-react'
import axios from 'axios'
import DoctorAgentCard, { doctorAgent } from './DoctorAgentCard'
import SuggestedDoctorCard from './SuggestedDoctorCard'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { SessionDetail } from '../medical-agent/[sessionId]/page'

function AddNewSessionDialog() {
    const [note, setNote] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [suggestedDoctors, setSuggestedDoctors] = useState<doctorAgent[]>();
    const [selectedDoctor, setSelectedDoctor] = useState<doctorAgent>();
    const [historyList, setHistoryList] = useState<SessionDetail[]>([]);

    const router = useRouter();
    const { has } = useAuth();

    //@ts-ignore
    const paidUser = has && has({ plan: 'pro' });

    useEffect(() => {
        GetHistoryList();
    }, [])

    const GetHistoryList = async () => {
        const result = await axios.get('/api/session-chat?sessionId=all');
        setHistoryList(result.data);
    }

    const OnClickNext = async () => {
        setLoading(true);
        const result = await axios.post('/api/suggest-doctors', { notes: note });
        setSuggestedDoctors(result.data);
        setLoading(false);
    }

    const onStartConsultation = async () => {
        setLoading(true);
        const result = await axios.post('/api/session-chat', {
            notes: note,
            selectedDoctor: selectedDoctor
        });
        if (result.data?.sessionId) {
            router.push('/dashboard/medical-agent/' + result.data.sessionId);
        }
        setLoading(false);
    }

    return (
        <Dialog>
            {/* Trigger button */}
            <DialogTrigger asChild>
                <Button
                    className='mt-1 sm:mt-0 gap-2'
                    disabled={!paidUser && historyList?.length >= 1}
                >
                    <Stethoscope size={16} />
                    Start a Consultation
                </Button>
            </DialogTrigger>

            {/* Dialog — full-width on mobile, capped on larger screens */}
            <DialogContent className='w-[95vw] max-w-lg sm:max-w-xl rounded-2xl'>
                <DialogHeader>
                    <DialogTitle className='text-lg sm:text-xl'>
                        {!suggestedDoctors ? 'Describe Your Symptoms' : 'Choose Your Doctor'}
                    </DialogTitle>

                    <DialogDescription asChild>
                        {!suggestedDoctors ? (
                            /* Step 1: Symptom input */
                            <div className='pt-2'>
                                <p className='text-sm text-muted-foreground mb-2'>
                                    Tell us what you&apos;re experiencing and we&apos;ll recommend the right specialist.
                                </p>
                                <Textarea
                                    placeholder='Describe your symptoms or concern here…'
                                    className='h-[160px] sm:h-[200px] mt-1 resize-none'
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        ) : (
                            /* Step 2: Doctor selection — 2 cols on mobile, 3 on sm+ */
                            <div className='pt-2'>
                                <p className='text-sm text-muted-foreground mb-3'>
                                    Tap a doctor to select, then start your consultation.
                                </p>
                                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                                    {suggestedDoctors.map((doctor, index) => (
                                        <SuggestedDoctorCard
                                            doctorAgent={doctor}
                                            key={index}
                                            setSelectedDoctor={() => setSelectedDoctor(doctor)}
                                            //@ts-ignore
                                            selectedDoctor={selectedDoctor}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Footer buttons */}
                <DialogFooter className='flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2'>
                    <DialogClose asChild>
                        <Button variant='outline' className='w-full sm:w-auto'>Cancel</Button>
                    </DialogClose>

                    {!suggestedDoctors ? (
                        <Button
                            disabled={!note || loading}
                            onClick={OnClickNext}
                            className='w-full sm:w-auto gap-2'
                        >
                            {loading ? <Loader2 className='animate-spin' size={16} /> : null}
                            Next
                            {!loading && <ArrowRight size={16} />}
                        </Button>
                    ) : (
                        <Button
                            disabled={loading || !selectedDoctor}
                            onClick={onStartConsultation}
                            className='w-full sm:w-auto gap-2'
                        >
                            {loading ? <Loader2 className='animate-spin' size={16} /> : null}
                            Start Consultation
                            {!loading && <ArrowRight size={16} />}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AddNewSessionDialog
