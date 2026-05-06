"use client"
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import AddNewSessionDialog from './AddNewSessionDialog';
import axios from 'axios';
import { SessionDetail } from '../medical-agent/[sessionId]/page';
import HistoryTable from './HistoryTable';

/**
 * HistoryList Component
 *
 * Shows previous consultations or an empty-state CTA.
 */
function HistoryList() {
    const [historyList, setHistoryList] = useState<SessionDetail[]>([]);

    useEffect(() => {
        GetHistoryList();
    }, [])

    const GetHistoryList = async () => {
        const result = await axios.get('/api/session-chat?sessionId=all');
        console.log(result.data);
        setHistoryList(result.data);
    }

    return (
        <div className='mt-8 md:mt-10'>
            {historyList.length === 0 ? (
                /* Empty state */
                <div className='flex items-center flex-col justify-center p-6 sm:p-10 border-2 border-dashed border-border rounded-2xl bg-secondary/30 text-center gap-3'>
                    <Image
                        src={'/medical-assistance.png'}
                        alt='empty'
                        width={120}
                        height={120}
                        className='opacity-80 w-20 h-20 sm:w-28 sm:h-28'
                    />
                    <div>
                        <h2 className='font-bold text-lg sm:text-xl mt-1'>No Recent Consultations</h2>
                        <p className='text-sm text-muted-foreground mt-1'>
                            You haven&apos;t consulted with any doctors yet.
                        </p>
                    </div>
                    <AddNewSessionDialog />
                </div>
            ) : (
                /* Consultation history table */
                <div>
                    <h2 className='font-bold text-lg sm:text-xl mb-4'>Recent Consultations</h2>
                    <HistoryTable historyList={historyList} />
                </div>
            )}
        </div>
    )
}

export default HistoryList
