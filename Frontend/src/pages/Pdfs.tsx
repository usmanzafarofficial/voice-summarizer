import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPdfs, type UserPdf } from "@/lib/api";
import { FilePdf, Calendar, Download } from "phosphor-react";
import jsPDF from "jspdf";

export default function Pdfs() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState<UserPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      navigate("/?login=1");
      return;
    }

    async function loadPdfs() {
      try {
        const data = await getUserPdfs(token);
        setPdfs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDFs");
      } finally {
        setLoading(false);
      }
    }

    loadPdfs();
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

  const handleDownloadPdf = (pdf: UserPdf) => {
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
      const date = formatDate(pdf.createdAt);
      doc.text(`Generated on: ${date}`, margin, margin + 10);

      // Add summary text
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(pdf.summaryText, maxWidth);
      let yPosition = margin + 25;

      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });

      // Save PDF
      doc.save(pdf.fileName || "voice-summary.pdf");
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    }
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
                My <span className="text-primary-glow">PDFs</span>
              </h1>
              <div className="w-full h-1 bg-gradient-primary rounded-full mx-auto mb-6" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              View and download all your generated PDF summaries
            </p>
          </div>

          {error && (
            <Card className="glass border-border mb-6">
              <CardContent className="p-6">
                <p className="text-destructive text-center">{error}</p>
              </CardContent>
            </Card>
          )}

          {pdfs.length === 0 && !error ? (
            <Card className="glass border-border shadow-glow-primary/20">
              <CardContent className="p-12 text-center">
                <FilePdf size={64} weight="thin" className="mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-light text-foreground mb-2">No PDFs Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Download summaries as PDFs to see them here
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfs.map((pdf) => (
                <Card
                  key={pdf._id}
                  className="glass border-border hover:shadow-glow-primary/20 transition-all duration-300 hover:border-primary/30 flex flex-col"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FilePdf size={24} weight="fill" className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium text-foreground truncate">
                          {pdf.fileName}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar size={12} />
                          <span>{formatDate(pdf.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="bg-background/50 border border-border/50 rounded-lg p-3 mb-4 flex-1">
                      <p className="text-foreground text-xs leading-relaxed whitespace-pre-wrap line-clamp-4">
                        {pdf.summaryText}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDownloadPdf(pdf)}
                      className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow-primary transition-all duration-300 hover:scale-105"
                      size="sm"
                    >
                      <Download size={16} weight="regular" className="mr-2" />
                      Download PDF
                    </Button>
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
