import React from 'react';
import PdfViewer from '../../blocks/PdfViewer'; // adjust path as needed

export default function Lpcvd() {
  const pdfPath = "/projects/presentations/LPCVD.pdf"; // ✅ must be relative to public/
  const description = `
    LPCVD (Low Pressure Chemical Vapor Deposition) is a method used to deposit thin films 
    onto substrates in semiconductor manufacturing. This lecture/paper covers the principles, 
    equipment, and process parameters.
  `;

  return (
    <div className="lecture-page p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">LPCVD Process Overview</h1>

      {/* PDF Viewer */}
      <div className="mb-6">
        <PdfViewer fileUrl={pdfPath} />
      </div>

      {/* Description */}
      <div className="description text-gray-700 text-base space-y-2">
        {description.split("\n").map((line, idx) => (
          <p key={idx}>{line.trim()}</p>
        ))}
      </div>
    </div>
  );
}
