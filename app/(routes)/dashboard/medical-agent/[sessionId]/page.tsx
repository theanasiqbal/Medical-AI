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
  const { sessionId } = useParams(); // Get sessionId from route parameters
  const [sessionDetail, setSessionDetail] = useState<SessionDetail>(); // Current session details
  const [callStarted, setCallStarted] = useState(false); // Call connection status
  const [vapiInstance, setVapiInstance] = useState<any>(null); // Instance of Vapi for voice interaction
  const [isMuted, setIsMuted] = useState(false); // Mute status
  const [currentRole, setCurrentRole] = useState<string | null>(null); // Current speaking role (user/assistant)
  const [liveTranscript, setLiveTranscript] = useState<string>(""); // Live transcription text
  const [messages, setMessages] = useState<messages[]>([]); // Finalized chat messages log
  const [loading, setLoading] = useState(false); // Loading state for UI feedback
  const router = useRouter();
  const callActiveRef = useRef(false);

  // Load session details on component mount or when sessionId changes
  useEffect(() => {
    if (sessionId) GetSessionDetails();
  }, [sessionId]);

  // Fetch session detail data from backend API
  const GetSessionDetails = async () => {
    const result = await axios.get(`/api/session-chat?sessionId=${sessionId}`);
    setSessionDetail(result.data);
  };

  /**
   * StartCall
   * Initializes and starts the voice call with the AI Medical Doctor Voice Agent
   * using the Vapi SDK and sets up event listeners for call and speech events.
   */
  const StartCall = () => {
    if (!sessionDetail) return;
    setLoading(true);

    // Initialize Vapi instance with your API key
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
    setVapiInstance(vapi);

    // Configuration for the AI voice agent
    const VapiAgentConfig = {
      name: "AI Medical Doctor Voice Agent",
      firstMessage:
        "नमस्ते! मैं आपकी एआई मेडिकल असिस्टेंट हूँ। मैं आपकी सेहत से जुड़े किसी भी सवाल में आपकी मदद कर सकती हूँ। आप आज कैसा महसूस कर रहे हैं?",

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

    // Event listeners for Vapi voice call lifecycle

    vapi.on("call-start", () => {
      callActiveRef.current = true;
      setLoading(false);
      setCallStarted(true);
      console.log("Call started");
    });

    vapi.on("call-end", () => {
      callActiveRef.current = false;
      setCallStarted(false);
      setVapiInstance(null);
      setIsMuted(false);
      console.log("Call ended");
    });

    vapi.on("message", (message) => {
      if (!callActiveRef.current) return;

      if (message.type === "transcript") {
        const { role, transcriptType, transcript } = message;
        if (transcriptType === "partial") {
          // Show live partial transcript while user/assistant is speaking
          setLiveTranscript(transcript);
          setCurrentRole(role);
        } else if (transcriptType === "final") {
          // Add finalized transcript to messages log
          setMessages((prev) => [...prev, { role, text: transcript }]);
          setLiveTranscript("");
          setCurrentRole(null);
        }
      }
    });

    vapi.on("speech-start", () => {
      setCurrentRole("assistant");
    });

    vapi.on("speech-end", () => {
      setCurrentRole("user");
    });
    vapi.on("error", (err) => {
      if (err?.errorMsg === "Meeting has ended") {
        console.log("Meeting already ended, ignoring");
        return;
      }

      console.error("Vapi error:", err);
    });
  };

  /**
   * toggleMute
   * Toggles the microphone status (muted/unmuted)
   */
  const toggleMute = () => {
    if (vapiInstance) {
      const newMuteStatus = !isMuted;
      vapiInstance.setMuted(newMuteStatus);
      setIsMuted(newMuteStatus);
      toast.info(newMuteStatus ? "Microphone Muted" : "Microphone Unmuted");
    }
  };

  /**
   * endCall
   * Ends the ongoing voice call, cleans up listeners, generates
   * a consultation report, and redirects the user back to dashboard.
   */
  const endCall = async () => {
    if (!vapiInstance || !callActiveRef.current) {
      router.replace("/dashboard");
      return;
    }

    callActiveRef.current = false;
    // Generate consultation report based on chat messages/
    try {
      const result = await GenerateReport();
    } catch (e) {
      console.error("Report generation failed", e);
    }

    // Stop the Vapi call and remove event listeners
    try {
      vapiInstance.stop();
    } catch {
      // call already ended — ignore
      console.log("Meeting already ended, ignoring");
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

    // Redirect to dashboard after call ends and report is generated
    router.replace("/dashboard");
  };

  /**
   * GenerateReport
   * Sends the collected messages and session details to backend API to
   * create a medical consultation report.
   */
  const GenerateReport = async () => {
    setLoading(true);
    const result = await axios.post("/api/medical-report", {
      messages: messages,
      sessionDetail: sessionDetail,
      sessionId: sessionId,
    });

    console.log(result.data);
    setLoading(false);

    return result.data;
  };

  const [duration, setDuration] = useState(0); // Call duration in seconds

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStarted) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStarted]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 border rounded-3xl bg-secondary min-h-[600px] flex flex-col">
      {/* Status bar showing if call is connected */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="p-2 px-4 border rounded-full flex gap-2 items-center bg-background/50 backdrop-blur-sm">
          <Circle
            className={`h-3 w-3 rounded-full ${
              callStarted ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium">
            {callStarted ? "Connected" : "Not Connected"}
          </span>
        </h2>
        <div className="flex items-center gap-4">
          <h2 className="font-mono text-xl text-gray-500">{formatDuration(duration)}</h2>
        </div>
      </div>

      {/* Main content grid */}
      {sessionDetail && (
        <div className="grid grid-cols-1 md:grid-cols-[30%_70%] gap-10 flex-1">
          {/* Left Column: Agent and Controls */}
          <div className="flex flex-col items-center justify-center border-r border-gray-200 dark:border-gray-800 pr-0 md:pr-10">
            <div className="relative group">
              <div className={`absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${callStarted ? 'animate-tilt' : ''}`}></div>
              <Image
                src={sessionDetail.selectedDoctor?.image}
                alt={sessionDetail.selectedDoctor?.specialist ?? ""}
                width={180}
                height={180}
                className="relative h-[160px] w-[160px] object-cover rounded-full border-4 border-background shadow-2xl"
              />
            </div>
            
            <div className="text-center mt-6">
              <h2 className="text-2xl font-bold text-foreground">
                {sessionDetail.selectedDoctor?.specialist}
              </h2>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">
                AI Medical Voice Agent
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {!callStarted ? (
                <Button 
                  size="lg"
                  className="rounded-full px-8 h-14 text-lg shadow-lg hover:shadow-primary/20 transition-all" 
                  onClick={StartCall} 
                  disabled={loading}
                >
                  {loading ? <Loader className="animate-spin mr-2" /> : <PhoneCall className="mr-2" />}
                  Start Call
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg"
                    variant="outline"
                    className={`rounded-full w-14 h-14 p-0 shadow-md ${isMuted ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : ''}`}
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff /> : <Mic />}
                  </Button>
                  
                  <Button 
                    size="lg"
                    variant="destructive" 
                    className="rounded-full px-8 h-14 text-lg shadow-lg"
                    onClick={endCall} 
                    disabled={loading}
                  >
                    {loading ? <Loader className="animate-spin mr-2" /> : <PhoneOff className="mr-2" />}
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Conversation Log */}
          <div className="flex flex-col bg-background/40 rounded-2xl p-6 shadow-inner overflow-hidden max-h-[500px]">
             <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Conversation Log
             </h3>
             
             <div className="overflow-y-auto flex-1 space-y-4 pr-2 custom-scrollbar">
                {messages.length === 0 && !liveTranscript && (
                  <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                    Waiting for conversation to start...
                  </div>
                )}
                
                <ul className="space-y-6">
                  {messages.reduce((acc: any[], current) => {
                    if (acc.length > 0 && acc[acc.length - 1].role === current.role) {
                      acc[acc.length - 1].text += ' ' + current.text;
                    } else {
                      acc.push({ role: current.role, text: current.text });
                    }
                    return acc;
                  }, []).map((group, groupIndex) => {
                    // Split assistant messages into points based on sentence boundaries (Hindi and English)
                    const points = group.role === 'assistant' 
                      ? group.text.split(/[।\.!\?]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 3)
                      : [group.text];

                    return (
                      <li key={groupIndex} className={`flex flex-col ${group.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[90%] p-5 rounded-3xl text-sm shadow-md transition-all ${
                          group.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-tr-none border-b-4 border-primary/20' 
                            : 'bg-background text-foreground rounded-tl-none border shadow-sm'
                        }`}>
                          <div className="flex items-center gap-2 mb-3 opacity-60">
                            <span className={`w-2 h-2 rounded-full ${group.role === 'user' ? 'bg-primary-foreground' : 'bg-primary'}`}></span>
                            <span className="font-bold text-[10px] uppercase tracking-widest">
                              {group.role}
                            </span>
                          </div>
                          
                          {group.role === 'assistant' && points.length > 1 ? (
                            <ul className="space-y-3">
                              {points.map((point: string, pointIndex: number) => (
                                <li key={pointIndex} className="flex gap-3 leading-relaxed">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/30 shrink-0"></span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="leading-relaxed whitespace-pre-wrap">
                              {group.text}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                  
                  {liveTranscript && (
                    <li className={`flex flex-col ${currentRole === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[90%] p-5 rounded-3xl text-sm shadow-md ${
                        currentRole === 'user' 
                          ? 'bg-primary/90 text-primary-foreground rounded-tr-none' 
                          : 'bg-background/90 text-foreground rounded-tl-none border border-primary/20'
                      }`}>
                        <div className="flex items-center gap-2 mb-3 opacity-60">
                          <span className={`w-2 h-2 rounded-full animate-pulse ${currentRole === 'user' ? 'bg-primary-foreground' : 'bg-primary'}`}></span>
                          <span className="font-bold text-[10px] uppercase tracking-widest">
                            {currentRole}
                          </span>
                        </div>
                        <p className="leading-relaxed italic">
                          {liveTranscript}
                          <span className="inline-flex w-1 h-4 bg-current ml-1 animate-pulse align-middle"></span>
                        </p>
                      </div>
                    </li>
                  )}
                </ul>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalVoiceAgent;
