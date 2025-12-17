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
import { ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'
import DoctorAgentCard, { doctorAgent } from './DoctorAgentCard'
import SuggestedDoctorCard from './SuggestedDoctorCard'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { SessionDetail } from '../medical-agent/[sessionId]/page'

function AddNewSessionDialog() {
    // 🧠 Local state management
    const [note, setNote] = useState<string>(); // stores user symptom input
    const [loading, setLoading] = useState(false); // tracks loading state
    const [suggestedDoctors, setSuggestedDoctors] = useState<doctorAgent[]>(); // stores suggested doctors
    const [selectedDoctor, setSelectedDoctor] = useState<doctorAgent>(); // tracks selected doctor
    const [historyList, setHistoryList] = useState<SessionDetail[]>([]); // stores past session list

    const router = useRouter();
    const { has } = useAuth();

    // ✅ Checks if user has a paid subscription (Clerk custom role)
    //@ts-ignore
    const paidUser = has && has({ plan: 'pro' });

    // 🧾 Fetch session history when dialog mounts
    useEffect(() => {
        GetHistoryList();
    }, [])

    // 📥 Get all previous session records
    const GetHistoryList = async () => {
        const result = await axios.get('/api/session-chat?sessionId=all');
        console.log(result.data);
        setHistoryList(result.data);
    }

    // 🧠 Handles the "Next" button click — suggests doctors based on user input
    const OnClickNext = async () => {
        setLoading(true);
        const result = await axios.post('/api/suggest-doctors', {
            notes: note
        });

        console.log(result.data);
        setSuggestedDoctors(result.data);
        setLoading(false);
    }

    // 🩺 Handles "Start Consultation" button — saves session and redirects
    const onStartConsultation = async () => {
        setLoading(true);
        const result = await axios.post('/api/session-chat', {
            notes: note,
            selectedDoctor: selectedDoctor
        });

        console.log(result.data);
        if (result.data?.sessionId) {
            // 🔁 Redirect to the new session page
            router.push('/dashboard/medical-agent/' + result.data.sessionId);
        }
        setLoading(false);
    }

    return (
        <Dialog>
            {/* 🔘 Open Dialog Button */}
            <DialogTrigger>
                <Button
                    className='mt-3'
                    disabled={!paidUser && historyList?.length >= 1} // restrict for free users
                >
                    + Start a Consultation
                </Button>
            </DialogTrigger>

            {/* 🗂️ Dialog Content */}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Basic Details</DialogTitle>
                    <DialogDescription asChild>
                        {/* Step 1: Enter Symptoms */}
                        {!suggestedDoctors ? (
                            <div>
                                <h2>Add Symptoms or Any Other Details</h2>
                                <Textarea
                                    placeholder='Add Detail here...'
                                    className='h-[200px] mt-1'
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        ) : (
                            // Step 2: Show Suggested Doctors
                            <div>
                                <h2>Select the doctor</h2>
                                <div className='grid grid-cols-3 gap-5'>
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

                {/* ✅ Dialog Footer with Buttons */}
                <DialogFooter>
                    {/* Cancel Button */}
                    <DialogClose>
                        <Button variant={'outline'}>Cancel</Button>
                    </DialogClose>

                    {/* Next or Start Button depending on the step */}
                    {!suggestedDoctors ? (
                        <Button
                            disabled={!note || loading}
                            onClick={() => OnClickNext()}
                        >
                            Next {loading ? <Loader2 className='animate-spin' /> : <ArrowRight />}
                        </Button>
                    ) : (
                        <Button
                            disabled={loading || !selectedDoctor}
                            onClick={() => onStartConsultation()}
                        >
                            Start Consultation {loading ? <Loader2 className='animate-spin' /> : <ArrowRight />}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AddNewSessionDialog
