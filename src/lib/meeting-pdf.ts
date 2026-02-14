import { jsPDF } from "jspdf";

interface Review {
  id: string;
  rating: number;
  appearanceScore: number | null;
  appearanceNotes: string | null;
  noseScore: number | null;
  nose: string | null;
  tasteScore: number | null;
  palate: string | null;
  mouthfeelScore: number | null;
  mouthfeel: string | null;
  finishScore: number | null;
  finish: string | null;
  notes: string | null;
  user: { id: string; name: string | null; email: string };
}

interface MeetingBourbon {
  id: string;
  bourbon: { id: string; name: string; distillery: string | null; proof: number | null };
  reviews: Review[];
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  description: string | null;
  location: string | null;
  bourbons: MeetingBourbon[];
}

interface Rsvp {
  id: string;
  status: "GOING" | "MAYBE" | "NOT_GOING";
  user: { id: string; name: string | null; email: string };
}

const CATEGORIES = [
  { label: "Appearance", scoreKey: "appearanceScore", notesKey: "appearanceNotes" },
  { label: "Nose", scoreKey: "noseScore", notesKey: "nose" },
  { label: "Taste", scoreKey: "tasteScore", notesKey: "palate" },
  { label: "Mouthfeel", scoreKey: "mouthfeelScore", notesKey: "mouthfeel" },
  { label: "Finish", scoreKey: "finishScore", notesKey: "finish" },
] as const;

export function generateMeetingPdf(meeting: Meeting, rsvps?: Rsvp[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to add wrapped text
  const addWrappedText = (text: string, fontSize: number, maxWidth: number): number => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.4;
    lines.forEach((line: string) => {
      checkPageBreak(lineHeight + 2);
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });
    return lines.length * lineHeight;
  };

  // Header - Meeting Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  addWrappedText(meeting.title, 20, contentWidth);
  yPos += 5;

  // Meeting Date
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const meetingDate = new Date(meeting.date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  doc.text(meetingDate, margin, yPos);
  yPos += 6;

  // Location
  if (meeting.location) {
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Location: ${meeting.location}`, margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 6;
  }

  // Description
  if (meeting.description) {
    yPos += 4;
    doc.setFontSize(11);
    addWrappedText(meeting.description, 11, contentWidth);
    yPos += 4;
  }

  // RSVP Summary
  if (rsvps && rsvps.length > 0) {
    yPos += 6;
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RSVP Summary", margin, yPos);
    yPos += 6;

    const goingCount = rsvps.filter((r) => r.status === "GOING").length;
    const maybeCount = rsvps.filter((r) => r.status === "MAYBE").length;
    const notGoingCount = rsvps.filter((r) => r.status === "NOT_GOING").length;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${goingCount} Going | ${maybeCount} Maybe | ${notGoingCount} Can't Make It`, margin, yPos);
    yPos += 8;
  }

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Bourbons Section
  if (meeting.bourbons.length === 0) {
    checkPageBreak(10);
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text("No bourbons were tasted at this meeting.", margin, yPos);
  } else {
    meeting.bourbons.forEach((mb, index) => {
      // Check if we need space for bourbon header
      checkPageBreak(40);

      // Bourbon Name
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      addWrappedText(mb.bourbon.name, 14, contentWidth);
      yPos += 2;

      // Bourbon Details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      const details = [
        mb.bourbon.distillery,
        mb.bourbon.proof ? `${mb.bourbon.proof}°` : null,
      ].filter(Boolean).join(" — ");
      if (details) {
        doc.text(details, margin, yPos);
        yPos += 6;
      } else {
        yPos += 4;
      }

      // Average Rating
      const avgRating = mb.reviews.length > 0
        ? (mb.reviews.reduce((sum, r) => sum + r.rating, 0) / mb.reviews.length).toFixed(1)
        : "—";

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`Average Rating: ${avgRating}/10`, margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`(${mb.reviews.length} review${mb.reviews.length !== 1 ? "s" : ""})`, margin + 50, yPos);
      yPos += 8;

      // Reviews
      if (mb.reviews.length > 0) {
        mb.reviews.forEach((review) => {
          checkPageBreak(50);

          // Reviewer Name
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          const reviewerName = review.user.name || review.user.email;
          doc.text(reviewerName, margin + 5, yPos);

          // Overall Score
          doc.setFont("helvetica", "normal");
          doc.text(`${review.rating.toFixed(1)}/10`, pageWidth - margin - 20, yPos);
          yPos += 5;

          // Category Scores Table
          const tableStartX = margin + 5;
          const colWidth = (contentWidth - 5) / 5;

          // Header row
          doc.setFontSize(8);
          doc.setTextColor(80, 80, 80);
          CATEGORIES.forEach((cat, i) => {
            const score = review[cat.scoreKey as keyof Review] as number | null;
            if (score != null) {
              doc.text(cat.label, tableStartX + i * colWidth, yPos);
            }
          });
          yPos += 4;

          // Scores row
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          CATEGORIES.forEach((cat, i) => {
            const score = review[cat.scoreKey as keyof Review] as number | null;
            if (score != null) {
              doc.text(`${score}/10`, tableStartX + i * colWidth, yPos);
            }
          });
          yPos += 6;

          // Notes
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);

          CATEGORIES.forEach((cat) => {
            const notes = review[cat.notesKey as keyof Review] as string | null;
            if (notes) {
              checkPageBreak(10);
              doc.setFont("helvetica", "italic");
              doc.setTextColor(80, 80, 80);
              doc.text(`${cat.label}:`, margin + 8, yPos);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(60, 60, 60);
              const notesLines = doc.splitTextToSize(notes, contentWidth - 40);
              notesLines.forEach((line: string) => {
                doc.text(line, margin + 32, yPos);
                yPos += 4;
              });
            }
          });

          // General Notes
          if (review.notes) {
            checkPageBreak(10);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(80, 80, 80);
            doc.text("Notes:", margin + 8, yPos);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(60, 60, 60);
            const notesLines = doc.splitTextToSize(review.notes, contentWidth - 40);
            notesLines.forEach((line: string) => {
              doc.text(line, margin + 32, yPos);
              yPos += 4;
            });
          }

          yPos += 4;
        });
      }

      // Separator between bourbons
      if (index < meeting.bourbons.length - 1) {
        yPos += 4;
        checkPageBreak(10);
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
      }
    });
  }

  // Footer on last page
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    doc.text(`Bourbon Club - Exported on ${currentDate}`, margin, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }

  // Save the PDF
  const fileName = `${meeting.title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
