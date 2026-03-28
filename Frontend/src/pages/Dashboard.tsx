import { useState, useRef, useCallback, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserUsage,
  incrementUsage,
  summarizeText,
  saveRecording,
  saveSummary,
  savePdf,
  updateRecordingWithSummary,
  type UsageData,
} from "@/lib/api";
import { Microphone, Square, CircleNotch, FilePdf, Pencil } from "phosphor-react";
import jsPDF from "jspdf";

// TypeScript types for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function Dashboard() {
  const { token } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribedText, setTranscribedText] = useState("");
  const [summarizedText, setSummarizedText] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      params.delete('payment');
      params.delete('session_id');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    if (token) {
      getUserUsage(token)
        .then(setUsage)
        .catch((err) => {
          console.error("Failed to load usage:", err);
          setUsageError(err instanceof Error ? err.message : "Failed to load usage");
        });
    }
  }, [token]);

  const startRecording = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    const SpeechRecognitionClass = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognitionClass() as SpeechRecognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscribedText(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        // Ignore no-speech errors
        return;
      }
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      alert(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      // Set final transcript
      const finalText = finalTranscript.trim();
      setTranscribedText(finalText);

      // Save recording to database
      if (finalText && token) {
        saveRecording(finalText, undefined, token).catch((err) => {
          console.error("Failed to save recording:", err);
        });
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setRecordingSeconds(0);
    setTranscribedText("");
    setSummarizedText("");

    recordingIntervalRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  const handleSummarize = async () => {
    if (!transcribedText.trim()) {
      alert("Please record some text first");
      return;
    }

    if (!token) {
      alert("Please log in to use this feature");
      return;
    }

    // Check usage limits
    if (usage) {
      const canGenerateVoice =
        usage.limits.voices === -1 || usage.usage.voicesGenerated < usage.limits.voices;

      if (!canGenerateVoice) {
        alert(
          `You've reached your limit of ${usage.limits.voices} AI voices. Please upgrade your plan to continue.`
        );
        return;
      }
    }

    setIsSummarizing(true);
    try {
      const result = await summarizeText(transcribedText, token);
      const summary = result.summarizedText.trim();
      
      // Only set if the summary is actually different from the original
      if (summary && summary !== transcribedText.trim()) {
        setSummarizedText(summary);
        setEditedSummary(summary);
        setIsEditingSummary(false);

        // Save summary to database and update recording
        try {
          await Promise.all([
            saveSummary(transcribedText.trim(), summary, token),
            updateRecordingWithSummary(transcribedText.trim(), summary, token),
          ]);
        } catch (err) {
          console.error("Failed to save summary:", err);
        }
      } else {
        alert("The summary appears to be the same as the original text. Please try again or check your OpenAI API key.");
      }

      // Track usage
      try {
        await incrementUsage("voices", 1, token);
        const updatedUsage = await getUserUsage(token);
        setUsage(updatedUsage);
      } catch (err) {
        console.error("Failed to track usage:", err);
      }
    } catch (err) {
      console.error("Summarization error:", err);
      alert(err instanceof Error ? err.message : "Failed to summarize text. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleEditSummary = () => {
    setIsEditingSummary(true);
    setEditedSummary(summarizedText);
  };

  const handleSaveEdit = async () => {
    if (!editedSummary.trim()) {
      alert("Summary cannot be empty");
      return;
    }

    if (!token) {
      alert("Please log in to use this feature");
      return;
    }

    // Check usage limits for edits
    if (usage) {
      const canEdit =
        usage.limits.edits === -1 || usage.usage.summarizationEdits < usage.limits.edits;

      if (!canEdit) {
        alert(
          `You've reached your limit of ${usage.limits.edits} summarization edits. Please upgrade your plan to continue.`
        );
        return;
      }
    }

    setIsSummarizing(true);
    try {
      // Re-summarize the edited text
      const result = await summarizeText(editedSummary, token);
      const summary = result.summarizedText.trim();
      
      if (summary && summary !== editedSummary.trim()) {
        setSummarizedText(summary);
        setEditedSummary(summary);
        // Save updated summary
        try {
          await saveSummary(editedSummary.trim(), summary, token);
        } catch (err) {
          console.error("Failed to save updated summary:", err);
        }
      } else {
        // If summary is same, just save the edited version
        setSummarizedText(editedSummary);
        // Save edited summary
        try {
          await saveSummary(editedSummary.trim(), editedSummary.trim(), token);
        } catch (err) {
          console.error("Failed to save edited summary:", err);
        }
      }
      setIsEditingSummary(false);

      // Track edit usage
      try {
        await incrementUsage("edits", 1, token);
        const updatedUsage = await getUserUsage(token);
        setUsage(updatedUsage);
      } catch (err) {
        console.error("Failed to track edit usage:", err);
      }
    } catch (err) {
      console.error("Edit summarization error:", err);
      // If re-summarization fails, just save the edited version
      setSummarizedText(editedSummary);
      setIsEditingSummary(false);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!summarizedText.trim()) {
      alert("No summary to download");
      return;
    }

    if (!token) {
      alert("Please log in to use this feature");
      return;
    }

    // Check usage limits
    if (usage) {
      const canDownload = usage.limits.pdfs === -1 || usage.usage.pdfDownloads < usage.limits.pdfs;
      if (!canDownload) {
        alert(
          `You've reached your limit of ${usage.limits.pdfs} PDF downloads. Please upgrade your plan to continue.`
        );
        return;
      }
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Add title
      doc.setFontSize(18);
      doc.text("Voice Summary", margin, margin);

      // Add date
      doc.setFontSize(10);
      const date = new Date().toLocaleDateString();
      doc.text(`Generated on: ${date}`, margin, margin + 10);

      // Add summary text
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(summarizedText, maxWidth);
      let yPosition = margin + 25;

      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });

      const fileName = `voice-summary-${Date.now()}.pdf`;
      // Save PDF
      doc.save(fileName);

      // Save PDF record to database
      try {
        await savePdf(summarizedText, fileName, token);
      } catch (err) {
        console.error("Failed to save PDF record:", err);
      }

      // Track usage
      try {
        await incrementUsage("pdfs", 1, token);
        const updatedUsage = await getUserUsage(token);
        setUsage(updatedUsage);
      } catch (err) {
        console.error("Failed to track download usage:", err);
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="container mx-auto px-6 pt-32 pb-16 max-w-4xl">
        {/* Hero */}
        <section className="text-center mb-12 animate-in fade-in duration-700">
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
              Voice <span className="text-primary-glow">Summarizer</span>
            </h1>
            <div className="w-full h-1 bg-gradient-primary rounded-full mx-auto mb-6" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Record your voice, get it transcribed, and summarize it with AI
          </p>
        </section>

        {/* Usage Display */}
        {usage && (
          <Card className="glass border-border mb-8 shadow-glow-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center md:text-left">
                  <div className="text-sm text-muted-foreground mb-2 font-medium">AI Voices</div>
                  <div className="text-2xl font-bold text-primary-glow">
                    {usage.usage.voicesGenerated} / {usage.limits.voices === -1 ? "∞" : usage.limits.voices}
                  </div>
                </div>
                <div className="text-center md:text-left border-l border-border">
                  <div className="text-sm text-muted-foreground mb-2 font-medium">Edits</div>
                  <div className="text-2xl font-bold text-primary-glow">
                    {usage.usage.summarizationEdits} / {usage.limits.edits === -1 ? "∞" : usage.limits.edits}
                  </div>
                </div>
                <div className="text-center md:text-left border-l border-border">
                  <div className="text-sm text-muted-foreground mb-2 font-medium">Downloads</div>
                  <div className="text-2xl font-bold text-primary-glow">
                    {usage.usage.pdfDownloads} / {usage.limits.pdfs === -1 ? "∞" : usage.limits.pdfs}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recording Section */}
        <Card className="glass border-border mb-6 shadow-glow-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-light text-primary-glow">Record Voice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-8 py-6 text-base font-medium transition-all duration-300 ${
                  isRecording
                    ? "bg-destructive hover:bg-destructive/90 hover:shadow-lg"
                    : "bg-gradient-primary text-primary-foreground hover:shadow-glow-primary hover:scale-105"
                }`}
              >
                {isRecording ? (
                  <>
                    <Square size={20} weight="fill" className="mr-2" />
                    Stop Recording ({formatTime(recordingSeconds)})
                  </>
                ) : (
                  <>
                    <Microphone size={20} weight="fill" className="mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
            </div>

              {transcribedText && (
                <div className="w-full space-y-5">
                  <div className="pb-3 border-b border-border/30">
                    <label className="text-base font-semibold text-primary-glow mb-3 block">
                      Transcribed Text
                    </label>
                    <div className="relative">
                      <Textarea
                        value={transcribedText}
                        onChange={(e) => setTranscribedText(e.target.value)}
                        className="min-h-[160px] w-full rounded-lg bg-background/60 border-2 border-border/50 focus:border-primary/60 resize-none text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background px-4 py-3 text-sm leading-relaxed shadow-sm"
                        placeholder="Your transcribed text will appear here..."
                      />
                      <div className="absolute top-2 right-2 text-xs text-muted-foreground/50">
                        {transcribedText.length} characters
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      onClick={handleSummarize}
                      disabled={isSummarizing || !transcribedText.trim()}
                      className="px-8 py-3 bg-gradient-primary text-primary-foreground hover:shadow-glow-primary transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium"
                    >
                      {isSummarizing ? (
                        <>
                          <CircleNotch size={18} weight="bold" className="mr-2 animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        "Summarize"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {summarizedText && (
                <div className="w-full space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-border/30">
                    <label className="text-base font-semibold text-primary-glow">
                      Summarized Text
                    </label>
                    <div className="flex gap-2.5">
                      <Button
                        onClick={handleEditSummary}
                        variant="outline"
                        size="sm"
                        className="px-4 py-2 border-border/50 bg-background/50 hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 hover:border-primary/50 transition-all duration-300 text-foreground hover:text-primary hover:shadow-md group"
                        disabled={isEditingSummary}
                      >
                        <Pencil size={16} weight="regular" className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                        Edit
                      </Button>
                      <Button
                        onClick={handleDownloadPDF}
                        variant="outline"
                        size="sm"
                        className="px-4 py-2 border-border/50 bg-background/50 hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 hover:border-primary/50 transition-all duration-300 text-foreground hover:text-primary hover:shadow-md group"
                      >
                        <FilePdf size={16} weight="regular" className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                        Download PDF
                      </Button>
                    </div>
                  </div>

                  {isEditingSummary ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <Textarea
                          value={editedSummary}
                          onChange={(e) => setEditedSummary(e.target.value)}
                          className="min-h-[180px] w-full rounded-lg bg-background/60 border-2 border-border/50 focus:border-primary/60 resize-none text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background px-4 py-3 text-sm leading-relaxed shadow-sm"
                          placeholder="Edit your summary..."
                        />
                        <div className="absolute top-2 right-2 text-xs text-muted-foreground/50">
                          {editedSummary.length} characters
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={handleSaveEdit}
                          disabled={isSummarizing || !editedSummary.trim()}
                          className="flex-1 px-6 py-3 bg-gradient-primary text-primary-foreground hover:shadow-glow-primary transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium"
                        >
                          {isSummarizing ? (
                            <>
                              <CircleNotch size={18} weight="bold" className="mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Pencil size={18} weight="regular" className="mr-2" />
                              Save & Re-summarize
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingSummary(false);
                            setEditedSummary(summarizedText);
                          }}
                          variant="outline"
                          className="px-6 py-3 border-2 border-border/50 hover:bg-muted/80 hover:border-primary/50 transition-all duration-300 font-medium"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 border-2 border-primary/30 backdrop-blur-sm shadow-lg hover:shadow-glow-primary/20 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="relative">
                          <p className="text-foreground whitespace-pre-wrap leading-relaxed text-[15px] font-light">
                            {summarizedText}
                          </p>
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary/40 rounded-full blur-sm animate-pulse" />
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-accent/40 rounded-full blur-sm animate-pulse delay-75" />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
