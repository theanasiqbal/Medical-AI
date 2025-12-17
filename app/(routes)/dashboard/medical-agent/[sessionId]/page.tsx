"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { doctorAgent } from "../../_components/DoctorAgentCard";
import { Circle, Loader, PhoneCall, PhoneOff } from "lucide-react";
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
        "नमस्ते! मैं आपका एआई मेडिकल असिस्टेंट हूँ। मैं आपकी सेहत से जुड़े किसी भी सवाल में आपकी मदद कर सकता हूँ। आप आज कैसा महसूस कर रहे हैं",
      transcriber: {
        model: "nova-3",
        provider: "deepgram",
        language: "hi",
      },
      voice: {
        model: "eleven_turbo_v2_5",
        voiceId: "MF4J4IDTRo0AxOO4dpFR",
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

    // if (!vapiInstance) return;

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

  return (
    <div className="p-5 border rounded-3xl bg-secondary">
      {/* Status bar showing if call is connected */}
      <div className="flex justify-between items-center">
        <h2 className="p-1 px-2 border rounded-md flex gap-2 items-center">
          <Circle
            className={`h-4 w-4 rounded-full ${
              callStarted ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {callStarted ? "Connected..." : "Not Connected"}
        </h2>
        <h2 className="font-bold text-xl text-gray-400">00:00</h2>{" "}
        {/* TODO: Add timer */}
      </div>

      {/* Main content shows doctor details and conversation */}
      {sessionDetail && (
        <div className="flex items-center flex-col mt-10">
          <Image
            src={sessionDetail.selectedDoctor?.image}
            alt={sessionDetail.selectedDoctor?.specialist ?? ""}
            width={120}
            height={120}
            className="h-[100px] w-[100px] object-cover rounded-full"
          />
          <h2 className="mt-2 text-lg">
            {sessionDetail.selectedDoctor?.specialist}
          </h2>
          <p className="text-sm text-gray-400">AI Medical Voice Agent</p>

          {/* Show last 4 finalized messages and live transcript */}
          <div className="mt-12 overflow-y-auto flex flex-col items-center px-10 md:px-28 lg:px-52 xl:px-72">
            {messages.slice(-4).map((msg, index) => (
              <h2 className="text-gray-400 p-2" key={index}>
                {msg.role}: {msg.text}
              </h2>
            ))}
            {liveTranscript && (
              <h2 className="text-lg">
                {currentRole} : {liveTranscript}
              </h2>
            )}
          </div>

          {/* Start or End Call buttons */}
          {!callStarted ? (
            <Button className="mt-20" onClick={StartCall} disabled={loading}>
              {loading ? <Loader className="animate-spin" /> : <PhoneCall />}{" "}
              Start Call
            </Button>
          ) : (
            <Button variant="destructive" onClick={endCall} disabled={loading}>
              {loading ? <Loader className="animate-spin" /> : <PhoneOff />}{" "}
              Disconnect
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default MedicalVoiceAgent;
