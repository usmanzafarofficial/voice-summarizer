import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getUserRecordings, type UserRecording } from "@/lib/api";
import { Microphone, Calendar, FileText } from "phosphor-react";

export default function Recordings() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<UserRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      navigate("/?login=1");
      return;
    }

    async function loadRecordings() {
      try {
        const data = await getUserRecordings(token);
        setRecordings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recordings");
      } finally {
        setLoading(false);
      }
    }

    loadRecordings();
  }, [user, token, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-block">
              <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
                My <span className="text-primary-glow">Recordings</span>
              </h1>
              <div className="w-full h-1 bg-gradient-primary rounded-full mx-auto mb-6" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              View all your voice recordings and transcriptions
            </p>
          </div>

          {error && (
            <Card className="glass border-border mb-6">
              <CardContent className="p-6">
                <p className="text-destructive text-center">{error}</p>
              </CardContent>
            </Card>
          )}

          {recordings.length === 0 && !error ? (
            <Card className="glass border-border shadow-glow-primary/20">
              <CardContent className="p-12 text-center">
                <Microphone size={64} weight="thin" className="mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-light text-foreground mb-2">No Recordings Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start recording your voice to see your transcriptions here
                </p>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-primary text-primary-foreground hover:shadow-glow-primary"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {recordings.map((recording) => (
                <Card
                  key={recording._id}
                  className="glass border-border hover:shadow-glow-primary/20 transition-all duration-300 hover:border-primary/30"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Microphone size={20} weight="fill" className="text-primary" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar size={16} />
                          <span>{formatDate(recording.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-primary" />
                        <label className="text-sm font-medium text-muted-foreground">
                          Transcribed Text
                        </label>
                      </div>
                      <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                          {recording.transcribedText}
                        </p>
                      </div>
                    </div>
                    {recording.summarizedText && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Summarized Text
                        </label>
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                            {recording.summarizedText}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
