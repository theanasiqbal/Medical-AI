import React from 'react'
import HistoryList from './_components/HistoryList'
import DoctorsAgentList from './_components/DoctorsAgentList'
import AddNewSessionDialog from './_components/AddNewSessionDialog'

function Dashboard() {
    return (
        <div>
            {/* Header row: stacks on mobile, side-by-side on sm+ */}
            {/* <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3'>
                <div>
                    <h2 className='font-bold text-xl sm:text-2xl'>My Dashboard</h2>
                    <p className='text-sm text-muted-foreground mt-0.5'>Manage your consultations</p>
                </div>
                <AddNewSessionDialog />
            </div> */}

            {/* <HistoryList /> */}
            <DoctorsAgentList />
        </div>
    )
}

export default Dashboard