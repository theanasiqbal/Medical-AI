"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { doctorAgent } from "../../_components/DoctorAgentCard";
import { Circle, Loader, Mic, MicOff, PhoneCall, PhoneOff } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";

export type SessionDetail = {
  id: number;
  notes: string;
  sessionId: string;
  report: JSON;
  selectedDoctor: doctorAgent;
  createdOn: string;
};

type messages = {
  role: string;
  text: string;
};

/**
 * MedicalVoiceAgent Component
 *
 * Provides an AI-powered medical voice assistant interface where users can
 * start a voice call with an AI doctor agent, interact in real-time,
 * view live transcripts, and generate a consultation report.
 */
function MedicalVoiceAgent() {
  const { sessionId } = useParams();
  const [sessionDetail, setSessionDetail] = useState<SessionDetail>();
  const [callStarted, setCallStarted] = useState(false);
  const [vapiInstance, setVapiInstance] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [messages, setMessages] = useState<messages[]>([]);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const router = useRouter();
  const callActiveRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) GetSessionDetails();
  }, [sessionId]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTranscript]);

  const GetSessionDetails = async () => {
    const result = await axios.get(`/api/session-chat?sessionId=${sessionId}`);
    setSessionDetail(result.data);
  };

  const StartCall = () => {
    if (!sessionDetail) return;
    setLoading(true);

    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
    setVapiInstance(vapi);

    const VapiAgentConfig = {
      name: "AI Medical Doctor Voice Agent",
      firstMessage:
        "Hi, I'm your AI Medical Assistant. How can i help you?  ",
      transcriber: {
        model: "nova-3",
        provider: "deepgram",
        language: "hi",
      },
      voice: {
        model: "eleven_turbo_v2_5",
        voiceId:
          sessionDetail.selectedDoctor?.voiceId ||
          process.env.NEXT_PUBLIC_FEMALE_VOICE_ID ||
          "MF4J4IDTRo0AxOO4dpFR",
        provider: "11labs",
        stability: 0.5,
        similarityBoost: 0.75,
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: sessionDetail.selectedDoctor?.agentPrompt,
          },
        ],
      },
    };

    //@ts-ignore
    vapi.start(VapiAgentConfig);

    vapi.on("call-start", () => {
      callActiveRef.current = true;
      setLoading(false);
      setCallStarted(true);
    });

    vapi.on("call-end", () => {
      callActiveRef.current = false;
      setCallStarted(false);
      setVapiInstance(null);
      setIsMuted(false);
    });

    vapi.on("message", (message) => {
      if (!callActiveRef.current) return;
      if (message.type === "transcript") {
        const { role, transcriptType, transcript } = message;
        if (transcriptType === "partial") {
          setLiveTranscript(transcript);
          setCurrentRole(role);
        } else if (transcriptType === "final") {
          setMessages((prev) => [...prev, { role, text: transcript }]);
          setLiveTranscript("");
          setCurrentRole(null);
        }
      }
    });

    vapi.on("speech-start", () => setCurrentRole("assistant"));
    vapi.on("speech-end", () => setCurrentRole("user"));
    vapi.on("error", (err) => {
      if (err?.errorMsg === "Meeting has ended") return;
      console.error("Vapi error:", err);
    });
  };

  const toggleMute = () => {
    if (vapiInstance) {
      const newMuteStatus = !isMuted;
      vapiInstance.setMuted(newMuteStatus);
      setIsMuted(newMuteStatus);
      toast.info(newMuteStatus ? "Microphone Muted" : "Microphone Unmuted");
    }
  };

  const endCall = async () => {
    if (!vapiInstance || !callActiveRef.current) {
      router.replace("/dashboard");
      return;
    }
    callActiveRef.current = false;
    try {
      await GenerateReport();
    } catch (e) {
      console.error("Report generation failed", e);
    }
    try {
      vapiInstance.stop();
    } catch {
      return;
    }
    vapiInstance.off("call-start");
    vapiInstance.off("call-end");
    vapiInstance.off("message");
    vapiInstance.off("speech-start");
    vapiInstance.off("speech-end");
    setCallStarted(false);
    setVapiInstance(null);
    setIsMuted(false);
    toast.success("Your report is generated!");
    router.replace("/dashboard");
  };

  const GenerateReport = async () => {
    setLoading(true);
    const result = await axios.post("/api/medical-report", {
      messages,
      sessionDetail,
      sessionId,
    });
    setLoading(false);
    return result.data;
  };

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStarted) {
      interval = setInterval(() => setDuration((prev) => prev + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStarted]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className='p-4 sm:p-6 md:p-8 border border-border rounded-2xl sm:rounded-3xl bg-secondary/40 min-h-[500px] flex flex-col gap-6'>

      {/* ─── Status Bar ─── */}
      <div className='flex justify-between items-center'>
        <span className='px-3 py-1.5 border border-border rounded-full flex gap-2 items-center bg-background/60 backdrop-blur-sm text-sm font-medium'>
          <Circle
            className={`h-2.5 w-2.5 rounded-full ${callStarted ? "text-green-500 fill-green-500 animate-pulse" : "text-red-500 fill-red-500"
              }`}
          />
          {callStarted ? "Connected" : "Not Connected"}
        </span>
        <span className='font-mono text-base sm:text-xl text-muted-foreground tabular-nums'>
          {formatDuration(duration)}
        </span>
      </div>

      {/* ─── Main Content ─── */}
      {sessionDetail && (
        /* Stack on mobile → side-by-side on md+ */
        <div className='flex flex-col md:grid md:grid-cols-[30%_70%] gap-6 md:gap-10 flex-1'>

          {/* ── Left: Agent Panel ── */}
          <div className='flex flex-col items-center justify-start md:justify-center md:border-r md:border-border pb-4 md:pb-0 md:pr-8 gap-5'>
            {/* Doctor avatar */}
            <div className='relative group'>
              <div className={`absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-20 group-hover:opacity-50 transition duration-700 ${callStarted ? "animate-pulse" : ""}`} />
              <Image
                src={sessionDetail.selectedDoctor?.image}
                alt={sessionDetail.selectedDoctor?.specialist ?? ""}
                width={180}
                height={180}
                className='relative h-28 w-28 sm:h-36 sm:w-36 md:h-40 md:w-40 object-cover rounded-full border-4 border-background shadow-2xl'
              />
            </div>

            {/* Doctor info */}
            <div className='text-center'>
              <h2 className='text-lg sm:text-xl md:text-2xl font-bold'>
                {sessionDetail.selectedDoctor?.specialist}
              </h2>
              <p className='text-xs text-muted-foreground uppercase tracking-wider mt-0.5'>
                AI Medical Voice Agent
              </p>
            </div>

            {/* Call controls */}
            <div className='flex flex-wrap justify-center gap-3'>
              {!callStarted ? (
                <Button
                  size='lg'
                  className='rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base shadow-lg hover:shadow-primary/20 transition-all gap-2'
                  onClick={StartCall}
                  disabled={loading}
                >
                  {loading ? <Loader className='animate-spin' size={18} /> : <PhoneCall size={18} />}
                  Start Call
                </Button>
              ) : (
                <>
                  <Button
                    size='lg'
                    variant='outline'
                    className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 shadow-md transition-colors ${isMuted ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100 dark:bg-red-950/30" : ""
                      }`}
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </Button>
                  <Button
                    size='lg'
                    variant='destructive'
                    className='rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base shadow-lg gap-2'
                    onClick={endCall}
                    disabled={loading}
                  >
                    {loading ? <Loader className='animate-spin' size={18} /> : <PhoneOff size={18} />}
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* ── Right: Conversation Log ── */}
          <div className='flex flex-col bg-background/50 rounded-2xl p-4 sm:p-6 shadow-inner border border-border/30 min-h-[300px] md:min-h-0 md:max-h-[480px]'>
            <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0'>
              <span className='w-1.5 h-1.5 bg-primary rounded-full' />
              Conversation Log
            </h3>

            <div className='overflow-y-auto flex-1 space-y-4 pr-1'>
              {messages.length === 0 && !liveTranscript && (
                <div className='h-full flex items-center justify-center text-muted-foreground italic text-sm text-center px-4'>
                  {callStarted
                    ? "Listening… start speaking!"
                    : "Start the call to begin your consultation."}
                </div>
              )}

              <ul className='space-y-4'>
                {messages
                  .reduce((acc: any[], current) => {
                    if (acc.length > 0 && acc[acc.length - 1].role === current.role) {
                      acc[acc.length - 1].text += " " + current.text;
                    } else {
                      acc.push({ role: current.role, text: current.text });
                    }
                    return acc;
                  }, [])
                  .map((group, groupIndex) => {
                    const points =
                      group.role === "assistant"
                        ? group.text
                          .split(/[।\.!\?]+/)
                          .map((s: string) => s.trim())
                          .filter((s: string) => s.length > 3)
                        : [group.text];

                    return (
                      <li
                        key={groupIndex}
                        className={`flex flex-col ${group.role === "user" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[92%] sm:max-w-[85%] p-3 sm:p-4 rounded-2xl text-sm shadow-sm ${group.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-background text-foreground rounded-tl-none border border-border"
                            }`}
                        >
                          <div className='flex items-center gap-1.5 mb-2 opacity-60'>
                            <span className={`w-1.5 h-1.5 rounded-full ${group.role === "user" ? "bg-primary-foreground" : "bg-primary"}`} />
                            <span className='font-bold text-[10px] uppercase tracking-widest'>{group.role}</span>
                          </div>

                          {group.role === "assistant" && points.length > 1 ? (
                            <ul className='space-y-2'>
                              {points.map((point: string, pi: number) => (
                                <li key={pi} className='flex gap-2 leading-relaxed'>
                                  <span className='mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0' />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className='leading-relaxed whitespace-pre-wrap'>{group.text}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}

                {/* Live partial transcript */}
                {liveTranscript && (
                  <li className={`flex flex-col ${currentRole === "user" ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] p-3 sm:p-4 rounded-2xl text-sm ${currentRole === "user"
                          ? "bg-primary/80 text-primary-foreground rounded-tr-none"
                          : "bg-background/80 text-foreground rounded-tl-none border border-primary/20"
                        }`}
                    >
                      <div className='flex items-center gap-1.5 mb-2 opacity-60'>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentRole === "user" ? "bg-primary-foreground" : "bg-primary"}`} />
                        <span className='font-bold text-[10px] uppercase tracking-widest'>{currentRole}</span>
                      </div>
                      <p className='leading-relaxed italic'>
                        {liveTranscript}
                        <span className='inline-flex w-0.5 h-4 bg-current ml-1 animate-pulse align-middle' />
                      </p>
                    </div>
                  </li>
                )}
              </ul>

              {/* Auto-scroll anchor */}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalVoiceAgent;
