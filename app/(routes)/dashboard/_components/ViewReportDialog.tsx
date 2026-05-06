import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { SessionDetail } from '../medical-agent/[sessionId]/page'
import moment from 'moment'

type props = {
    record: SessionDetail
}

/**
 * ViewReportDialog Component
 * Full consultation report in a mobile-friendly dialog.
 */
function ViewReportDialog({ record }: props) {
    const report: any = record?.report
    const formatDate = moment(record?.createdOn).format("MMMM Do YYYY, h:mm a")

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant='link' size='sm' className='text-blue-600 hover:text-blue-800 px-0'>
                    View Report
                </Button>
            </DialogTrigger>

            {/* Responsive dialog: nearly full-screen on mobile, capped on desktop */}
            <DialogContent className='w-[95vw] max-w-[95vw] sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl'>
                <DialogHeader>
                    <DialogTitle asChild>
                        <h2 className='text-center text-xl sm:text-2xl md:text-3xl font-bold text-blue-500 mb-2'>
                            🩺 Medical AI Voice Agent Report
                        </h2>
                    </DialogTitle>

                    <DialogDescription asChild>
                        <div className='space-y-5 text-gray-800 dark:text-gray-200 text-sm'>

                            {/* Section 1: Session Info */}
                            <div>
                                <h3 className='text-base sm:text-lg font-semibold text-blue-500'>Session Info</h3>
                                <hr className='border-t-2 border-blue-500 my-2' />
                                {/* Stacks on mobile, 2 cols on sm+ */}
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                    <p><strong>Doctor:</strong> {record?.selectedDoctor?.specialist}</p>
                                    <p><strong>User:</strong> {report?.user || 'Anonymous'}</p>
                                    <p><strong>Consulted On:</strong> {formatDate}</p>
                                    <p><strong>Agent:</strong> {report?.agent}</p>
                                </div>
                            </div>

                            {/* Section 2: Chief Complaint */}
                            <div>
                                <h3 className='text-base sm:text-lg font-semibold text-blue-500'>Chief Complaint</h3>
                                <hr className='border-t-2 border-blue-500 my-2' />
                                <p>{report?.chiefComplaint}</p>
                            </div>

                            {/* Section 3: Summary */}
                            <div>
                                <h3 className='text-base sm:text-lg font-semibold text-blue-500'>Summary</h3>
                                <hr className='border-t-2 border-blue-500 my-2' />
                                <p>{report?.summary}</p>
                            </div>

                            {/* Section 4: Symptoms */}
                            <div>
                                <h3 className='text-base sm:text-lg font-semibold text-blue-500'>Symptoms</h3>
                                <hr className='border-t-2 border-blue-500 my-2' />
                                <ul className='list-disc list-inside space-y-1'>
                                    {report?.symptoms?.map((symptom: string, index: number) => (
                                        <li key={index}>{symptom}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Section 5: Duration & Severity */}
                            <div>
                                <h3 className='text-base sm:text-lg font-semibold text-blue-500'>Duration &amp; Severity</h3>
                                <hr className='border-t-2 border-blue-500 my-2' />
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                    <p><strong>Duration:</strong> {report?.duration || 'Not specified'}</p>
                                    <p><strong>Severity:</strong> {report?.severity}</p>
                                </div>
                            </div>

                            {/* Section 6: Medications */}
                            {report?.medicationsMentioned?.length > 0 && (
                                <div>
                                    <h3 className='text-base sm:text-lg font-semibold text-blue-500'>Medications Mentioned</h3>
                                    <hr className='border-t-2 border-blue-500 my-2' />
                                    <ul className='list-disc list-inside space-y-1'>
                                        {report.medicationsMentioned.map((med: string, index: number) => (
                                            <li key={index}>{med}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Section 7: Recommendations */}
                            {report?.recommendations?.length > 0 && (
                                <div>
                                    <h3 className='text-base sm:text-lg font-semibold text-blue-500'>Recommendations</h3>
                                    <hr className='border-t-2 border-blue-500 my-2' />
                                    <ul className='list-disc list-inside space-y-1'>
                                        {report.recommendations.map((rec: string, index: number) => (
                                            <li key={index}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Disclaimer */}
                            <div className='pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400'>
                                This report was generated by an AI Medical Assistant for informational purposes only. Always consult a licensed physician.
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default ViewReportDialog
