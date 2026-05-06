import React from 'react'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SessionDetail } from '../medical-agent/[sessionId]/page'
import moment from 'moment'
import ViewReportDialog from './ViewReportDialog'

type Props = {
    historyList: SessionDetail[]
}

/**
 * HistoryTable Component
 * Displays previous consultation sessions in a horizontally scrollable table.
 */
function HistoryTable({ historyList }: Props) {
    return (
        /* Horizontal scroll wrapper keeps the table from overflowing on small screens */
        <div className='w-full overflow-x-auto rounded-xl border border-border'>
            <Table className='min-w-[500px]'>
                <TableCaption className='pb-3'>Previous Consultation Reports</TableCaption>

                <TableHeader>
                    <TableRow className='bg-secondary/50'>
                        <TableHead className='font-semibold'>Specialist</TableHead>
                        <TableHead className='font-semibold hidden sm:table-cell'>Description</TableHead>
                        <TableHead className='font-semibold'>Date</TableHead>
                        <TableHead className='text-right font-semibold'>Report</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {historyList.map((record: SessionDetail, index: number) => (
                        <TableRow key={index} className='hover:bg-secondary/30 transition-colors'>
                            {/* Doctor specialty */}
                            <TableCell className='font-medium'>
                                {record.selectedDoctor.specialist}
                            </TableCell>

                            {/* Notes — hidden on very small screens */}
                            <TableCell className='hidden sm:table-cell text-muted-foreground max-w-[160px] truncate'>
                                {record.notes}
                            </TableCell>

                            {/* Human-readable timestamp */}
                            <TableCell className='text-muted-foreground whitespace-nowrap text-xs sm:text-sm'>
                                {moment(new Date(record.createdOn)).fromNow()}
                            </TableCell>

                            {/* View Report action */}
                            <TableCell className='text-right'>
                                <ViewReportDialog record={record} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default HistoryTable
