import { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import Head from "next/head";

function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan, 7 = Aug (August session start)
  const startYear = month >= 7 ? year : year - 1;
  const endYearShort = (startYear + 1).toString().slice(-2);
  return `${startYear}-${endYearShort}`;
}

function generateAcademicYears() {
  const startYear = 2019;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan, 7 = Aug (August session start)
  const maxStartYear = month >= 7 ? year : year - 1;
  const years = [];
  for (let y = startYear; y <= maxStartYear; y++) {
    const nextY = (y + 1).toString().slice(-2);
    years.push(`${y}-${nextY}`);
  }
  return years;
}

const ACADEMIC_YEARS = generateAcademicYears();
const CURRENT_YEAR = getCurrentAcademicYear();
const MODULES = ["journals", "patents", "conferences", "fdp", "bookchapters", "books"];

const THEMES = [
  { id: "classic", label: "Classic Navy", color: "#0f2942", icon: "🏛" },
  { id: "dark", label: "Midnight Dark", color: "#38bdf8", icon: "🌙" },
  { id: "indigo", label: "Royal Indigo", color: "#7c3aed", icon: "🔮" },
  { id: "teal", label: "Ocean Teal", color: "#0d9488", icon: "🌊" },
  { id: "sunset", label: "Warm Amber", color: "#ea580c", icon: "🌅" },
];

const MODULE_CONFIG = [
  { id: "dashboard", label: "Dashboard", icon: "⊞", adminOnly: false },
  { id: "profile", label: "My Profile", icon: "👤", adminOnly: false },
  { id: "journals", label: "Journal Papers", icon: "📄", adminOnly: false },
  { id: "patents", label: "Patents / IPR", icon: "🏛", adminOnly: false },
  { id: "conferences", label: "Conferences", icon: "🎤", adminOnly: false },
  { id: "fdp", label: "FDP / STTP", icon: "🎓", adminOnly: false },
  { id: "bookchapters", label: "Book Chapters", icon: "📑", adminOnly: false },
  { id: "books", label: "Books", icon: "📚", adminOnly: false },
  { id: "users", label: "Manage Users", icon: "👥", adminOnly: true },
  { id: "branches", label: "Manage Branches", icon: "🏫", adminOnly: true },
  { id: "reports", label: "Reports", icon: "📊", adminOnly: true },
];

const getFieldConfigs = function (depts) {
  return {
    journals: {
      title: "Journal Paper", color: "#0284c7",
      fields: [
        { name: "title", label: "Title of the Research Paper", type: "text", required: true, span: 2 },
        { name: "affiliation", label: "Your Affiliation in the Paper (BPIT / Research Scholar / Other)", type: "select", options: ["BPIT", "Research Scholar", "Other"], required: true },
        { name: "authors", label: "Author List", type: "text", required: true, span: 2 },
        { name: "totalAuthors", label: "Total Number of Authors", type: "number", required: true, min: 1 },
        { name: "authorPosition", label: "Position of Your Name in Authors List", type: "number", required: true, min: 1 },
        { name: "correspondingAuthor", label: "First / Corresponding Author?", type: "select", options: ["Yes", "No"], required: true },
        { name: "phdWork", label: "Is paper Belongs to PhD Work?", type: "select", options: ["Yes", "No"], required: true },
        { name: "supervisorFirstAuthor", label: "Is Your Supervisor First Author?", type: "select", options: ["Yes", "No"] },
        { name: "coAuthorsBPIT", label: "If any co-authors belongs to BPIT, mention their Faculty IDs", type: "text", span: 2 },
        { name: "studentDetails", label: "Name of Student & Branch (If published with Students)", type: "text", span: 2 },
        { name: "journal", label: "Name of the Journal", type: "text", required: true },
        { name: "issn", label: "ISSN of the Journal", type: "text", required: true },
        { name: "publisher", label: "Publisher of the Journal", type: "text", required: true },
        { name: "department", label: "Department", type: "select", options: depts, required: true },
        { name: "status", label: "Status", type: "select", options: ["Published", "Online Preprint", "Accepted"], required: true },
        { name: "publicationMonth", label: "Month of the Publication (Numeric)", type: "number", required: true, min: 1, max: 12 },
        { name: "year", label: "Year of the Publication", type: "select", options: Array.from({ length: new Date().getFullYear() - 2001 + 1 }, (_, i) => String(2001 + i)), required: true },
        { name: "frequency", label: "Frequency (Yearly / H.Yearly / Quarterly / Monthly / etc.)", type: "text" },
        { name: "volume", label: "Volume No.", type: "number", min: 1 },
        { name: "issue", label: "Issue No.", type: "number", min: 1 },
        { name: "pages", label: "Page No(s) (e.g. 5-9)", type: "text" },
        { name: "impactFactor", label: "Impact Factor of the Journal", type: "text" },
        { name: "sciScie", label: "SCI/SCIE", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "esci", label: "ESCI", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "scopus", label: "Scopus", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "quartile", label: "Quartile of Journal", type: "select", options: ["Q1", "Q2", "Q3", "Q4", "N/A"], required: true },
        { name: "ugcCareListed", label: "UGC Care Listed", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "peerReviewed", label: "Peer Reviewed", type: "select", options: ["Yes", "No"], required: true },
        { name: "citationsWoS", label: "No. of Citations (WoS/Scopus)", type: "text" },
        { name: "citationsGoogleScholar", label: "No. of Citations (Google Scholar)", type: "text" },
        { name: "doi", label: "DOI Number", type: "text", span: 2, placeholder: "https://doi.org/<prefix>/<suffix>" },
        { name: "link", label: "Link / URL", type: "text", span: 2 },
        { name: "awardMoney", label: "Award Money Received by BPIT (if any)", type: "text" },
        { name: "academicYear", label: "Academic Year", type: "select", options: ACADEMIC_YEARS, required: true },
      ],
      columns: ["title", "affiliation", "totalAuthors", "authorPosition", "correspondingAuthor", "phdWork", "supervisorFirstAuthor", "coAuthorsBPIT", "studentDetails", "journal", "issn", "publisher", "department", "status", "publicationMonth", "year", "frequency", "volume", "issue", "pages", "impactFactor", "quartile", "sciScie", "esci", "scopus", "ugcCareListed", "peerReviewed", "citationsWoS", "citationsGoogleScholar", "doi", "link", "awardMoney"],
      colLabels: ["Paper Title", "Affiliation", "Total Authors", "Author Position", "Corresponding Author", "PhD Work", "Supervisor First Author", "BPIT Co-authors", "Student Details", "Journal", "ISSN", "Publisher", "Department", "Status", "Month", "Year", "Frequency", "Volume", "Issue", "Pages", "Impact Factor", "Quartile", "SCI/SCIE", "ESCI", "Scopus", "UGC Care", "Peer Reviewed", "Citations (WoS/Scopus)", "Citations (Google Scholar)", "DOI", "Link", "Award Money"],
    },
    patents: {
      title: "Patent / IPR", color: "#7c3aed",
      fields: [
        { name: "title", label: "Invention Title", type: "text", required: true, span: 2 },
        { name: "inventors", label: "Inventors", type: "text", required: true, span: 2 },
        { name: "applicationNo", label: "Application Number", type: "text", required: true },
        { name: "filingDate", label: "Filing Date", type: "date", required: true },
        { name: "publicationDate", label: "Publication Date", type: "date" },
        { name: "grantDate", label: "Grant Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["Filed", "Published", "Granted", "Rejected"], required: true },
        { name: "type", label: "Patent Type", type: "select", options: ["Utility", "Design", "Plant", "Software"] },
        { name: "country", label: "Country", type: "text", required: true },
        { name: "patentNo", label: "Patent Number / Copyright Number (if granted)", type: "text" },
        { name: "iprValidityGrantYears", label: "Validity of the Grant (No. of Years)", type: "number", min: 1 },
        { name: "assigneesInstituteAffiliation", label: "Assignee/s Name (Institute Affiliation/s at time of Application)", type: "text", span: 2 },
        { name: "yourAffiliationInIPR", label: "Your Affiliation in the IPR", type: "select", options: ["BPIT", "Research Scholar", "Other"] },
        { name: "department", label: "Department", type: "select", options: depts, required: true },
        { name: "academicYear", label: "Academic Year", type: "select", options: ACADEMIC_YEARS, required: true },
      ],
      columns: ["title", "inventors", "applicationNo", "filingDate", "status", "type", "country", "iprValidityGrantYears", "assigneesInstituteAffiliation", "yourAffiliationInIPR", "department"],
      colLabels: ["Invention Title", "Inventors", "Application No.", "Filing Date", "Status", "Type", "Country", "IPR Validity", "Assignees", "Your Affiliation", "Dept"],
    },
    conferences: {
      title: "Conference Paper", color: "#059669",
      fields: [
        { name: "title", label: "Paper Title", type: "text", required: true, span: 2 },
        { name: "affiliation", label: "Your Affiliation in the Paper (BPIT / Research Scholar / Other)", type: "select", options: ["BPIT", "Research Scholar", "Other"], required: true },
        { name: "authors", label: "Authors", type: "text", required: true, span: 2 },
        { name: "totalAuthors", label: "Total No. of Authors", type: "number", required: true, min: 1 },
        { name: "authorPosition", label: "Position of Your Name in Authors List", type: "number", required: true, min: 1 },
        { name: "correspondingAuthor", label: "First / Corresponding Author? (Yes/No)", type: "select", options: ["Yes", "No"], required: true },
        { name: "phdWork", label: "Is paper Belongs to PhD Work? (Yes/No)", type: "select", options: ["Yes", "No"], required: true },
        { name: "supervisorFirstAuthor", label: "Is Your Supervisor First Author? (Yes/No)", type: "select", options: ["Yes", "No"] },
        { name: "coAuthorsBPIT", label: "If any co-authors belongs to BPIT then mentioned their Faculty IDs", type: "text", span: 2 },
        { name: "studentDetails", label: "Name of Student & Branch (If Published with Students)", type: "text", span: 2 },
        { name: "conference", label: "Conference Name", type: "text", required: true, span: 2 },
        { name: "organized", label: "Organized By", type: "text", required: true, span: 2 },
        { name: "location", label: "Location (City, Country)", type: "text", required: true },
        { name: "date", label: "Conference Date", type: "date", required: true },
        { name: "status", label: "Status (Accepted / Presented)", type: "select", options: ["Accepted", "Presented"], required: true },
        { name: "presentationDate", label: "Date of Presentation (if presented)", type: "date" },
        { name: "presentationMode", label: "Mode of the Presentation (Online / Offline)", type: "select", options: ["Online", "Offline"] },
        { name: "proceedingsPublished", label: "Is published in the Proceedings? (Yes/No)", type: "select", options: ["Yes", "No"] },
        { name: "proceedingsTitle", label: "Title of the Proceedings / Book Series", type: "text", span: 2 },
        { name: "proceedingsISBN", label: "ISBN of the Proceedings / Book", type: "text" },
        { name: "proceedingsPublisher", label: "Publisher of the Proceedings / Book", type: "text", span: 2 },
        { name: "publicationMonth", label: "Month of the Publication (Numeric)", type: "number", min: 1, max: 12 },
        { name: "year", label: "Year of the Publication", type: "select", options: Array.from({ length: new Date().getFullYear() - 2001 + 1 }, (_, i) => String(2001 + i)), required: true },
        { name: "volume", label: "Volume No", type: "number", min: 1 },
        { name: "issue", label: "Issue No (if any)", type: "number", min: 1 },
        { name: "pages", label: "Page No(s)", type: "text" },
        { name: "scopus", label: "Scopus (Yes/No)", type: "select", options: ["Yes", "No"] },
        { name: "doi", label: "DOI Number Link / URL (if any)", type: "text", span: 2 },
        { name: "registrationAmount", label: "Registration Amount (if any)", type: "text" },
        { name: "amountSponsoredByBPIT", label: "Amount Sponsored by BPIT (if any)", type: "text" },
        { name: "indexed", label: "Indexing", type: "select", options: ["Scopus", "WoS", "IEEE Xplore", "ACM", "Not Indexed"] },
        { name: "paperType", label: "Presentation Type", type: "select", options: ["Oral", "Poster", "Invited Talk", "Keynote"] },
        { name: "department", label: "Department", type: "select", options: depts, required: true },
        { name: "academicYear", label: "Academic Year", type: "select", options: ACADEMIC_YEARS, required: true },
      ],
      columns: ["title", "affiliation", "totalAuthors", "authorPosition", "correspondingAuthor", "phdWork", "supervisorFirstAuthor", "coAuthorsBPIT", "studentDetails", "conference", "organized", "location", "date", "status", "presentationDate", "presentationMode", "proceedingsPublished", "proceedingsTitle", "proceedingsISBN", "proceedingsPublisher", "publicationMonth", "year", "volume", "issue", "pages", "scopus", "doi", "registrationAmount", "amountSponsoredByBPIT", "indexed", "paperType"],
      colLabels: ["Paper Title", "Affiliation", "Total Authors", "Author Position", "Corresponding Author", "PhD Work", "Supervisor First Author", "BPIT Co-authors", "Student Details", "Conference", "Organized By", "Location", "Date", "Status", "Presentation Date", "Presentation Mode", "Proceedings Published", "Proceedings Title", "Proceedings ISBN", "Proceedings Publisher", "Publication Month", "Year", "Volume", "Issue", "Pages", "Scopus", "DOI", "Registration Amount", "Amount Sponsored by BPIT", "Indexed", "Type"],
    },
    fdp: {
      title: "FDP / STTP / Workshop", color: "#d97706",
      fields: [
        { name: "title", label: "Program Title", type: "text", required: true, span: 2 },
        { name: "faculty", label: "Participating Faculty", type: "text", required: true, span: 2 },
        { name: "organizer", label: "Organizing Institute", type: "text", required: true },
        { name: "sponsor", label: "Sponsored By (AICTE/DST etc.)", type: "text" },
        { name: "mode", label: "Mode", type: "select", options: ["Online", "Offline", "Hybrid"], required: true },
        { name: "type", label: "Program Type", type: "select", options: ["FDP", "STTP", "Workshop", "Seminar", "Webinar", "Certification"] },
        { name: "startDate", label: "Start Date", type: "date", required: true },
        { name: "endDate", label: "End Date", type: "date", required: true },
        { name: "duration", label: "Duration (in Days / Weeks)", type: "text", required: true },
        { name: "certificateNo", label: "Certificate Number", type: "text" },
        { name: "amountSponsoredByBPIT", label: "Amount Sponsored by BPIT (if any)", type: "text" },
        { name: "department", label: "Department", type: "select", options: depts, required: true },
        { name: "academicYear", label: "Academic Year", type: "select", options: ACADEMIC_YEARS, required: true },
      ],
      columns: ["title", "faculty", "organizer", "mode", "type", "startDate", "endDate", "duration", "certificateNo", "amountSponsoredByBPIT", "department"],
      colLabels: ["Program Title", "Faculty", "Organizer", "Mode", "Type", "Start Date", "End Date", "Duration", "Certificate No.", "Amount Sponsored by BPIT", "Dept"],
    },
    bookchapters: {
      title: "Book Chapter", color: "#dc2626",
      fields: [
        { name: "title", label: "Chapter Title", type: "text", required: true, span: 2 },
        { name: "affiliation", label: "Your Affiliation in the Paper (BPIT / Research Scholar / Other)", type: "select", options: ["BPIT", "Research Scholar", "Other"], required: true },
        { name: "authors", label: "Author List", type: "text", required: true, span: 2 },
        { name: "totalAuthors", label: "Total No. of Authors", type: "number", required: true, min: 1 },
        { name: "authorPosition", label: "Position of Your Name in Authors List", type: "number", required: true, min: 1 },
        { name: "correspondingAuthor", label: "First / Corresponding Author? (Yes/No)", type: "select", options: ["Yes", "No"], required: true },
        { name: "phdWork", label: "Is Book Chapter Belongs to PhD Work? (Yes/No)", type: "select", options: ["Yes", "No"], required: true },
        { name: "supervisorFirstAuthor", label: "Is Your Supervisor First Author? (Yes/No)", type: "select", options: ["Yes", "No"] },
        { name: "coAuthorsBPIT", label: "If any co-authors belongs to BPIT then mentioned their Faculty IDs", type: "text", span: 2 },
        { name: "studentDetails", label: "Name of Student & Branch if published with Students", type: "text", span: 2 },
        { name: "bookTitle", label: "Book Title", type: "text", required: true },
        { name: "editors", label: "Book Editors", type: "text" },
        { name: "publisher", label: "Publisher", type: "text", required: true },
        { name: "isbn", label: "ISBN / ISSN", type: "text" },
        { name: "status", label: "Status (Published / Online Preprint / Accepted)", type: "select", options: ["Published", "Online Preprint", "Accepted"], required: true },
        { name: "publicationMonth", label: "Month of the Publication (Numeric)", type: "number", required: true, min: 1, max: 12 },
        { name: "year", label: "Year of Publication", type: "select", options: Array.from({ length: new Date().getFullYear() - 2001 + 1 }, (_, i) => String(2001 + i)), required: true },
        { name: "volume", label: "Volume No.", type: "number", min: 1 },
        { name: "pageNo", label: "Page No(s)", type: "text" },
        { name: "impactFactor", label: "Impact Factor of the Book", type: "text" },
        { name: "sciScie", label: "SCI/SCIE (Yes/No)", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "esci", label: "ESCI (Yes/No)", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "scopus", label: "Scopus (Yes/No)", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "scopusQuadrant", label: "Quartile of Journal * (Q1/Q2/Q3/Q4)", type: "select", options: ["Q1", "Q2", "Q3", "Q4", "N/A"], required: true },
        { name: "ugcCareListed", label: "UGC Care Listed (Yes/No)", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "peerReviewed", label: "Peer Reviewed (Yes/No)", type: "select", options: ["Yes", "No"], required: true },
        { name: "doi", label: "DOI", type: "text", span: 2, placeholder: "https://doi.org/<prefix>/<suffix>" },
        { name: "link", label: "URL (if any)", type: "text", span: 2 },
        { name: "department", label: "Department", type: "select", options: depts, required: true },
        { name: "academicYear", label: "Academic Year", type: "select", options: ACADEMIC_YEARS, required: true },
      ],
      columns: ["title", "affiliation", "totalAuthors", "authorPosition", "correspondingAuthor", "phdWork", "supervisorFirstAuthor", "coAuthorsBPIT", "studentDetails", "bookTitle", "publisher", "isbn", "status", "publicationMonth", "year", "volume", "pageNo", "impactFactor", "sciScie", "esci", "scopus", "scopusQuadrant", "ugcCareListed", "peerReviewed", "doi", "link", "department"],
      colLabels: ["Chapter Title", "Affiliation", "Total Authors", "Author Position", "Corresponding Author", "PhD Work", "Supervisor First Author", "BPIT Co-authors", "Student Details", "Book Title", "Publisher", "ISBN / ISSN", "Status", "Pub. Month", "Year", "Volume", "Page No(s)", "Impact Factor", "SCI/SCIE", "ESCI", "Scopus", "Scopus Quadrant", "UGC Care", "Peer Reviewed", "DOI", "URL", "Dept"],
    },
    books: {
      title: "Book / Textbook", color: "#0891b2",
      fields: [
        { name: "title", label: "Book Title", type: "text", required: true, span: 2 },
        { name: "affiliation", label: "Your Affiliation in the Book (BPIT / Other)", type: "select", options: ["BPIT", "Other"], required: true },
        { name: "role", label: "Your Role in the Book (Author / Editor)", type: "select", options: ["Author", "Editor"], required: true },
        { name: "authorPosition", label: "Position of Your Name in Authors / Editors List", type: "number", required: true, min: 1 },
        { name: "authors", label: "List of All Authors / Editors (as per sequence in published book)", type: "text", required: true, span: 2 },
        { name: "coAuthorsBPIT", label: "If any co-author / editor belongs to BPIT then mentioned their Faculty IDs", type: "text", span: 2 },
        { name: "publisher", label: "Publisher", type: "text", required: true },
        { name: "isbn", label: "ISBN", type: "text" },
        { name: "publicationMonth", label: "Month of the Publication (Numeric)", type: "number", required: true, min: 1, max: 12 },
        { name: "year", label: "Year of Publication", type: "select", options: Array.from({ length: new Date().getFullYear() - 2001 + 1 }, (_, i) => String(2001 + i)), required: true },
        { name: "bookPublished", label: "Book Published (National / International)", type: "select", options: ["National", "International"], required: true },
        { name: "edition", label: "Edition", type: "number", required: true, min: 1 },
        { name: "type", label: "Book Type", type: "select", options: ["Textbook", "Reference", "Edited Volume", "Monograph"], required: true },
        { name: "pages", label: "Total Pages", type: "number", required: true, min: 1 },
        { name: "volume", label: "Vol & Issue No. (if any)", type: "text" },
        { name: "sciScie", label: "SCI/SCIE (Yes/No)", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "esci", label: "ESCI (Yes/No)", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "scopus", label: "Scopus (Yes/No)", type: "select", options: ["Yes", "No"], required: true, placeholder: "Select Yes/No" },
        { name: "doi", label: "DOI Number", type: "text", span: 2, placeholder: "https://doi.org/<prefix>/<suffix>" },
        { name: "link", label: "URL (if any)", type: "text", span: 2 },
        { name: "department", label: "Department", type: "select", options: depts, required: true },
        { name: "academicYear", label: "Academic Year", type: "select", options: ACADEMIC_YEARS, required: true },
      ],
      columns: ["title", "affiliation", "role", "authorPosition", "authors", "coAuthorsBPIT", "publisher", "isbn", "year", "publicationMonth", "bookPublished", "edition", "type", "pages", "volume", "sciScie", "esci", "scopus", "doi", "link", "department"],
      colLabels: ["Book Title", "Affiliation", "Role", "Author/Editor Position", "Authors / Editors", "BPIT Co-authors/Editors", "Publisher", "ISBN", "Year", "Pub. Month", "Published", "Edition", "Type", "Pages", "Vol & Issue", "SCI/SCIE", "ESCI", "Scopus", "DOI", "URL", "Dept"],
    },
  };
};

const STATUS_COLORS = {
  Published: "#22c55e", Granted: "#22c55e", Accepted: "#22c55e",
  Filed: "#f59e0b", "Under Review": "#f59e0b", Rejected: "#ef4444",
  Online: "#8b5cf6", Offline: "#0ea5e9", Hybrid: "#10b981",
  Q1: "#22c55e", Q2: "#3b82f6", Q3: "#f59e0b", Q4: "#ef4444",
  Oral: "#0284c7", Poster: "#7c3aed", "Invited Talk": "#059669", Keynote: "#dc2626",
  Scopus: "#3b82f6", WoS: "#7c3aed", "IEEE Xplore": "#0284c7", ACM: "#ef4444", "Not Indexed": "#94a3b8",
  admin: "#dc2626", faculty: "#0284c7",
};

// ── API Helper ────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders(extraHeaders = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('erp_token') : null;
  const headers = { ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

const api = {
  async get(url) {
    const r = await fetch(API_URL + url, { credentials: 'include', headers: getAuthHeaders() });
    if (!r.ok) { const e = await r.json().catch(function () { return { error: 'Error' }; }); throw new Error(e.error || 'Error'); }
    return r.json();
  },
  async post(url, body) {
    const r = await fetch(API_URL + url, { method: 'POST', credentials: 'include', headers: getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
    if (!r.ok) { const e = await r.json().catch(function () { return { error: 'Error' }; }); throw new Error(e.error || 'Error'); }
    return r.json();
  },
  async put(url, body) {
    const r = await fetch(API_URL + url, { method: 'PUT', credentials: 'include', headers: getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
    if (!r.ok) { const e = await r.json().catch(function () { return { error: 'Error' }; }); throw new Error(e.error || 'Error'); }
    return r.json();
  },
  async del(url) {
    const r = await fetch(API_URL + url, { method: 'DELETE', credentials: 'include', headers: getAuthHeaders() });
    if (!r.ok) { const e = await r.json().catch(function () { return { error: 'Error' }; }); throw new Error(e.error || 'Error'); }
    return r.json();
  }
};

// ── Shared Styles ─────────────────────────────────────────────────────────────
const TH = { textAlign: "left", padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-color)", whiteSpace: "nowrap", background: "var(--table-th-bg)" };
const TD = { padding: "11px 14px", fontSize: 13, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "middle" };
const INPUT = { width: "100%", padding: "10px 13px", border: "1.5px solid var(--input-border)", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "var(--text-primary)", background: "var(--input-bg)" };
function Btn(v) {
  return { padding: "6px 12px", background: v === "del" ? "#fef2f2" : v === "edit" ? "#eff6ff" : "#f0fdf4", color: v === "del" ? "#ef4444" : v === "edit" ? "#2563eb" : "#059669", border: "1px solid " + (v === "del" ? "#fecaca" : v === "edit" ? "#bfdbfe" : "#bbf7d0"), borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" };
}

// ── UI Components ─────────────────────────────────────────────────────────────
function Badge({ text, size }) {
  const sz = size || "sm";
  const c = STATUS_COLORS[text] || "#6b7280";
  return (
    <span style={{ background: c + "20", color: c, border: "1px solid " + c + "40", padding: sz === "sm" ? "2px 8px" : "4px 12px", borderRadius: 99, fontSize: sz === "sm" ? 11 : 13, fontWeight: 700, whiteSpace: "nowrap", display: "inline-block" }}>
      {text}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.type === "error" ? "#ef4444" : "#22c55e";
  return (
    <div className="toast-animate" style={{ position: "fixed", top: 20, right: 20, background: bg, color: "#fff", padding: "13px 22px", borderRadius: 12, fontWeight: 700, zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,0.25)", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
      {toast.type === "error" ? "⚠" : "✓"} {toast.msg}
    </div>
  );
}

function Modal({ children, onClose, width, isMobile }) {
  const w = width || 740;
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--modal-overlay)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}
      onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-animate" style={{ background: "var(--bg-surface)", color: "var(--text-primary)", borderRadius: 18, padding: isMobile ? 20 : 28, width: "min(" + w + "px, 96vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--card-shadow)", border: "1px solid var(--border-color)" }}>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return <div style={{ textAlign: "center", padding: "30px", color: "#cbd5e1", fontSize: 13 }}>{label}</div>;
}

function FormField({ f, form, setForm, departments, isMobile }) {
  const opts = f.name === "department" ? departments : (f.options || []);
  const fieldName = f.name;
  function handleChange(e) {
    const val = e.target.value;
    setForm(function (p) {
      const next = Object.assign({}, p);
      next[fieldName] = val;
      return next;
    });
  }
  return (
    <div style={{ gridColumn: (isMobile || f.span !== 2) ? "span 1" : "span 2" }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 5, display: "block" }}>
        {f.label}{f.required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {f.type === "select" ? (
        <select style={INPUT} value={form[fieldName] || ""} onChange={handleChange}>
          <option value="">{f.placeholder || "Select " + f.label + "..."}</option>
          {opts.map(function (o) { return <option key={o} value={o}>{o}</option>; })}
        </select>
      ) : f.type === "textarea" ? (
        <textarea style={Object.assign({}, INPUT, { minHeight: 70, resize: "vertical" })} value={form[fieldName] || ""} onChange={handleChange} placeholder={f.placeholder || f.label} />
      ) : (
        <input type={f.type} style={INPUT} value={form[fieldName] || ""} onChange={handleChange} placeholder={f.placeholder || f.label} {...(f.type === "number" ? { min: f.min, max: f.max } : {})} />
      )}
    </div>
  );
}

function FormFields({ fields, form, setForm, departments, isMobile }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
      {fields.map(function (f) {
        return <FormField key={f.name} f={f} form={form} setForm={setForm} departments={departments} isMobile={isMobile} />;
      })}
    </div>
  );
}

// ── DOI Lookup Helper & Component ─────────────────────────────────────────────
function extractDoi(str) {
  if (!str) return "";
  const cleaned = str.trim();
  const match = cleaned.match(/(?:doi\.org\/|dx\.doi\.org\/)?(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
  return match ? match[1] : cleaned;
}

function findAuthorPosition(authorNames, userName) {
  if (!userName || !Array.isArray(authorNames) || authorNames.length === 0) return "";
  const cleanUser = userName.toLowerCase().trim();
  for (let i = 0; i < authorNames.length; i++) {
    const cleanAuth = authorNames[i].toLowerCase().trim();
    if (cleanAuth === cleanUser) {
      return String(i + 1);
    }
  }
  for (let i = 0; i < authorNames.length; i++) {
    const cleanAuth = authorNames[i].toLowerCase().trim();
    if (cleanAuth.includes(cleanUser) || cleanUser.includes(cleanAuth)) {
      return String(i + 1);
    }
  }
  const userWords = cleanUser.split(/\s+/).filter(function (w) { return w.length > 2; });
  if (userWords.length > 0) {
    for (let i = 0; i < authorNames.length; i++) {
      const cleanAuth = authorNames[i].toLowerCase().trim();
      const authWords = cleanAuth.split(/\s+/).filter(function (w) { return w.length > 2; });
      const matches = userWords.filter(function (w) { return authWords.includes(w); });
      if (matches.length > 0) {
        return String(i + 1);
      }
    }
  }
  return "";
}

function mapCrossRefToForm(msg, active, userName) {
  const result = {};

  if (Array.isArray(msg.title) && msg.title.length > 0) {
    result.title = msg.title[0];
  } else if (typeof msg.title === "string") {
    result.title = msg.title;
  }

  if (Array.isArray(msg.author)) {
    const authorNames = msg.author.map(function (auth) {
      if (auth.given && auth.family) {
        return auth.given + " " + auth.family;
      }
      return auth.name || auth.family || auth.given || "";
    }).filter(Boolean);
    result.authors = authorNames.join(", ");
    result.totalAuthors = String(authorNames.length);
    const pos = findAuthorPosition(authorNames, userName);
    if (pos) {
      result.authorPosition = pos;
    }
  }

  let dateParts = null;
  if (msg.published && msg.published["date-parts"] && msg.published["date-parts"][0]) {
    dateParts = msg.published["date-parts"][0];
  } else if (msg["published-print"] && msg["published-print"]["date-parts"] && msg["published-print"]["date-parts"][0]) {
    dateParts = msg["published-print"]["date-parts"][0];
  } else if (msg["published-online"] && msg["published-online"]["date-parts"] && msg["published-online"]["date-parts"][0]) {
    dateParts = msg["published-online"]["date-parts"][0];
  } else if (msg.created && msg.created["date-parts"] && msg.created["date-parts"][0]) {
    dateParts = msg.created["date-parts"][0];
  }

  if (dateParts && dateParts.length > 0) {
    const yr = String(dateParts[0]);
    result.year = yr;
    if (dateParts.length > 1) {
      result.publicationMonth = String(dateParts[1]);
    }
  }

  if (msg.volume) {
    result.volume = String(msg.volume);
  }

  if (msg.issue) {
    result.issue = String(msg.issue);
  }

  if (msg.page) {
    result.pages = msg.page;
    result.pageNo = msg.page;
  }

  if (msg.DOI) {
    result.doi = msg.DOI;
  }
  if (msg.URL) {
    result.link = msg.URL;
  }

  if (msg.publisher) {
    result.publisher = Array.isArray(msg.publisher) ? msg.publisher[0] : msg.publisher;
  }

  if (active === "journals") {
    if (Array.isArray(msg["container-title"]) && msg["container-title"].length > 0) {
      result.journal = msg["container-title"][0];
    }
    if (Array.isArray(msg.ISSN) && msg.ISSN.length > 0) {
      result.issn = msg.ISSN[0];
    }
    if (typeof msg["is-referenced-by-count"] === "number") {
      result.citationsWoS = String(msg["is-referenced-by-count"]);
    }
    if (msg.DOI && !msg.DOI.startsWith("http")) {
      result.doi = "https://doi.org/" + msg.DOI;
    }
    result.status = "Published";
    result.peerReviewed = "Yes";
    result.sciScie = "No";
    result.esci = "No";
    result.scopus = "No";
    result.ugcCareListed = "No";
    result.quartile = "N/A";
  } else if (active === "conferences") {
    if (Array.isArray(msg["container-title"]) && msg["container-title"].length > 0) {
      result.conference = msg["container-title"][0];
    }
    result.status = "Accepted";
    result.scopus = "No";
    result.indexed = "Not Indexed";
  } else if (active === "bookchapters") {
    if (Array.isArray(msg["container-title"]) && msg["container-title"].length > 0) {
      result.bookTitle = msg["container-title"][0];
    }
    if (Array.isArray(msg.ISBN) && msg.ISBN.length > 0) {
      result.isbn = msg.ISBN[0];
    }
    result.status = "Published";
    result.peerReviewed = "Yes";
    result.sciScie = "No";
    result.esci = "No";
    result.scopus = "No";
    result.ugcCareListed = "No";
    result.scopusQuadrant = "N/A";
  }

  return result;
}

function DoiLookup({ active, setForm, showToast, user, isMobile }) {
  const [doi, setDoi] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(null);

  async function handleFetch() {
    const cleanDoi = extractDoi(doi);
    if (!cleanDoi) {
      showToast(active === "patents" ? "Please enter a valid Patent Number or Google Patents URL" : "Please enter a valid DOI or DOI URL", "error");
      return;
    }
    setFetching(true);
    setFetched(null);
    try {
      const res = await fetch(`/api/doi?doi=${encodeURIComponent(cleanDoi)}`);
      if (!res.ok) {
        const errJson = await res.json().catch(function () { return {}; });
        throw new Error(errJson.error || `Server returned status ${res.status}`);
      }
      const json = await res.json();

      if (json.isPatent) {
        const patent = Object.assign({}, json.patent);
        if (patent.assignees) {
          patent.assigneesInstituteAffiliation = patent.assignees;
          delete patent.assignees;
        }
        if (user && user.dept && user.dept !== "Administration") {
          patent.department = user.dept;
        }
        setForm(function (prev) {
          return Object.assign({}, prev, patent);
        });

        const filledCount = Object.keys(patent).filter(function (k) { return patent[k]; }).length;
        setFetched({
          title: patent.title || "Untitled Patent",
          filled: filledCount
        });
        showToast(`Successfully fetched & auto-filled ${filledCount} fields!`, "success");
        return;
      }

      if (!json.message) {
        throw new Error("No data found for this DOI");
      }
      const mapped = mapCrossRefToForm(json.message, active, user ? user.name : "");

      if (json.indexing) {
        mapped.scopus = json.indexing.scopus;
        mapped.sciScie = json.indexing.sciScie;
        mapped.esci = json.indexing.esci;
      }

      if (active === "journals") {
        try {
          const sres = await fetch(`https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(cleanDoi)}?fields=citationCount`);
          if (sres.ok) {
            const sjson = await sres.json();
            if (sjson && typeof sjson.citationCount === "number") {
              mapped.citationsWoS = String(sjson.citationCount);
            }
          }
        } catch (err) {
          console.warn("Semantic Scholar fetch failed: " + err.message);
        }
      }

      setForm(function (prev) {
        return Object.assign({}, prev, mapped);
      });

      const filledCount = Object.keys(mapped).length;
      setFetched({
        title: mapped.title || "Untitled Paper",
        filled: filledCount
      });
      showToast(`Successfully fetched & auto-filled ${filledCount} fields!`, "success");
    } catch (err) {
      console.warn("Fetch metadata error: " + err.message);
      showToast(err.message || "Failed to fetch metadata", "error");
    } finally {
      setFetching(false);
    }
  }

  return (
    <div style={{ background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>⚡</span> {active === "patents" ? "Auto-fill from Patent Number / Google Patents URL" : "Auto-fill from DOI / Article URL"}
      </div>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
        <input
          style={Object.assign({}, INPUT, { flex: 1, border: "1.5px solid #90e0ef", background: "#fff" })}
          value={doi}
          onChange={function (e) { setDoi(e.target.value); }}
          placeholder={active === "patents" ? "e.g. US10000000B2 or https://patents.google.com/patent/US10000000B2/en" : "e.g. 10.1109/ACCESS.2024.1234567 or https://doi.org/..."}
          disabled={fetching}
        />
        <button
          onClick={handleFetch}
          disabled={fetching}
          style={{
            padding: "10px 20px",
            background: fetching ? "#93c5fd" : "linear-gradient(135deg,#0284c7,#0369a1)",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            fontWeight: 700,
            fontSize: 13,
            cursor: fetching ? "not-allowed" : "pointer",
            width: isMobile ? "100%" : "auto"
          }}
        >
          {fetching ? "Fetching..." : "🔍 Fetch"}
        </button>
      </div>
      {fetched && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#0369a1", background: "#e0f2fe", padding: "8px 12px", borderRadius: 8, borderLeft: "3.5px solid #0284c7" }}>
          <strong>✅ Fetched:</strong> "{fetched.title}" ({fetched.filled} fields auto-filled)
        </div>
      )}
    </div>
  );
}

// ── Export Helpers ────────────────────────────────────────────────────────────
function downloadWorkbook(wb, filename) {
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeSheetName(name) {
  if (!name) return "Sheet1";
  const invalidChars = /[\\:*?\[\]\/]/g;
  const safe = name.replace(invalidChars, " ").trim();
  return safe.substring(0, 31) || "Sheet1";
}

function exportToExcel(moduleId, records, FIELD_CONFIGS) {
  const cfg = FIELD_CONFIGS[moduleId];
  if (!cfg) return;
  const headers = cfg.fields.map(function (f) { return f.label; });
  const rows = records.map(function (r) { return cfg.fields.map(function (f) { return r[f.name] || ""; }); });
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map(function () { return { wch: 20 }; });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(cfg.title));
  downloadWorkbook(wb, cfg.title + "_" + Date.now() + ".xlsx");
}

function exportAllToExcel(data, FIELD_CONFIGS, academicYear, notify) {
  const wb = XLSX.utils.book_new();
  let sheetCount = 0;
  Object.entries(FIELD_CONFIGS).forEach(function (entry) {
    const key = entry[0]; const cfg = entry[1];
    let records = data[key] || [];
    if (academicYear && academicYear !== "All") records = records.filter(function (r) { return r.academicYear === academicYear; });
    if (!records.length) return;
    const headers = cfg.fields.map(function (f) { return f.label; });
    const rows = records.map(function (r) { return cfg.fields.map(function (f) { return r[f.name] || ""; }); });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(function () { return { wch: 18 }; });
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(cfg.title));
    sheetCount += 1;
  });

  if (sheetCount === 0) {
    if (typeof notify === "function") {
      notify("No report data available for export", "error");
    }
    return;
  }

  downloadWorkbook(wb, "Research_ERP_Export_" + Date.now() + ".xlsx");
}

function printToPDF(moduleId, records, FIELD_CONFIGS, title, dept, yr) {
  const cfg = FIELD_CONFIGS[moduleId];
  const cols = cfg.columns; const lbls = cfg.colLabels;
  const html = "<!DOCTYPE html><html><head><title>" + cfg.title + "</title><style>body{font-family:Arial;margin:20px;font-size:11px}h1{color:#1e3a5f;font-size:18px}table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#1e3a5f;color:#fff;padding:7px;text-align:left;font-size:10px}td{padding:6px;border-bottom:1px solid #e5e7eb;font-size:10px}tr:nth-child(even) td{background:#f8fafc}</style></head><body><h1>BPIT — " + title + " Report</h1><p style='color:#555;font-size:11px'>Dept: " + (dept || "All") + " | Year: " + (yr || "All") + " | Records: " + records.length + " | " + new Date().toLocaleString() + "</p><table><thead><tr>" + lbls.map(function (l) { return "<th>" + l + "</th>"; }).join("") + "</tr></thead><tbody>" + records.map(function (r) { return "<tr>" + cols.map(function (c) { return "<td>" + (r[c] || "—") + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></body></html>";
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.onload = function () { w.print(); };
}

function printResume(user, profile) {
  const f = profile || {};

  const sections = [
    { title: "Basic Details", data: { "Title": f.title, "Full Name": [f.firstName, f.middleName, f.lastName].filter(Boolean).join(" "), "Gender": f.gender, "Date of Birth": f.dob ? new Date(f.dob).toLocaleDateString() : "", "Category": f.category, "Blood Group": f.bloodGroup, "Nationality": f.nationality } },
    { title: "Academic Qualification", data: { "Highest Degree": f.highestDegree, "University": f.university, "Area of Specialization": f.specialization } },
    { title: "Contact & Identity", data: { "Mobile": f.mobile, "Email": f.email, "Aadhaar No": f.aadhaarNo, "PAN No": f.panNo, "APAAR Faculty ID": f.apaarFacultyId } },
    { title: "Institutional Employment", data: { "Present Designation": f.presentDesig, "Department": f.presentDept, "Designation at Joining": f.desigAtJoiningInst, "Date of Joining": f.doj ? new Date(f.doj).toLocaleDateString() : "", "Experience in Current Institute (Yrs)": f.experienceYearsCurrInst, "Date Designated Prof/Assoc Prof": f.dateDesignatedProfAssocProf ? new Date(f.dateDesignatedProfAssocProf).toLocaleDateString() : "", "Nature of Association": f.natureOfAssociation, "Contract Type": f.contractType, "Currently Associated": f.currentlyAssociated, "Date of Leaving": f.dateOfLeaving ? new Date(f.dateOfLeaving).toLocaleDateString() : "" } },
    { title: "Address", data: { "Present Address": [f.presentAddrHNoFloor, f.presentAddrStreetArea, f.presentAddrCity, f.presentAddrDistrict, f.presentAddrCountry, f.presentAddrPin].filter(Boolean).join(", "), "Permanent Address": [f.permanentAddrHNoFloor, f.permanentAddrStreetArea, f.permanentAddrCity, f.permanentAddrDistrict, f.permanentAddrCountry, f.permanentAddrPin].filter(Boolean).join(", ") } },
    { title: "Family Details", data: { "Father's Name": f.fatherName, "Mother's Name": f.motherName, "Spouse's Name": f.spouseName } }
  ];

  let html = "<!DOCTYPE html><html><head><title>" + user.name + " - Resume</title>";
  html += "<style>body{font-family:Arial,sans-serif;margin:40px;color:#333;line-height:1.6}h1{color:#0f2942;margin-bottom:5px;font-size:26px;text-align:center}h2{color:#2563eb;font-size:16px;border-bottom:2px solid #e5e7eb;padding-bottom:4px;margin-top:20px}table{width:100%;border-collapse:collapse;margin-top:8px}td{padding:6px 0;vertical-align:top;font-size:13px}td:first-child{font-weight:600;width:30%;color:#555}.subtitle{text-align:center;color:#666;font-size:14px;margin-bottom:20px}</style>";
  html += "</head><body>";

  html += "<h1>" + (user.name || "Resume") + "</h1>";
  html += "<div class='subtitle'>" + (f.presentDesig || "Faculty") + " | " + (f.presentDept || user.dept || "") + "</div>";

  sections.forEach(function (sec) {
    let hasData = false;
    let tableHtml = "<table><tbody>";
    for (const key in sec.data) {
      if (sec.data[key] && sec.data[key].toString().trim() !== "") {
        hasData = true;
        tableHtml += "<tr><td>" + key + "</td><td>" + sec.data[key] + "</td></tr>";
      }
    }
    tableHtml += "</tbody></table>";
    if (hasData) {
      html += "<h2>" + sec.title + "</h2>" + tableHtml;
    }
  });

  html += "</body></html>";

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.onload = function () { w.print(); };
}

// ── BranchesPanel ─────────────────────────────────────────────────────────────
function BranchesPanel({ departments, setDepartments, showToast, isMobile }) {
  const [newDept, setNewDept] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const val = newDept.trim().toUpperCase();
    if (!val) { showToast("Enter a branch name", "error"); return; }
    if (departments.includes(val)) { showToast("Branch already exists", "error"); return; }
    setSaving(true);
    try {
      await api.post('/api/departments', { name: val });
      setDepartments(function (p) { return [...p, val].sort(); });
      setNewDept("");
      showToast("Branch \"" + val + "\" added");
    } catch (e) { showToast(e.message, "error"); }
    setSaving(false);
  }

  async function handleDelete(dept) {
    try {
      await api.del('/api/departments?name=' + encodeURIComponent(dept));
      setDepartments(function (p) { return p.filter(function (d) { return d !== dept; }); });
      showToast("Branch \"" + dept + "\" removed");
      setConfirmDel(null);
    } catch (e) { showToast(e.message, "error"); }
  }

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#0f2942", fontSize: 15 }}>🏫 Manage Branches / Departments</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>These branches appear in all publication forms</div>
          </div>
          <span style={{ background: "#f0f9ff", color: "#0284c7", border: "1.5px solid #bae6fd", padding: "4px 14px", borderRadius: 99, fontWeight: 800, fontSize: 13 }}>{departments.length} Branches</span>
        </div>
        <div style={{ padding: "18px 20px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 10 }}>➕ Add New Branch</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <input value={newDept} onChange={function (e) { setNewDept(e.target.value); }}
              onKeyDown={function (e) { if (e.key === "Enter") handleAdd(); }}
              placeholder="e.g. CSE, MECH, BIOTECH..."
              style={Object.assign({}, INPUT, { maxWidth: isMobile ? "100%" : 280, flex: isMobile ? "1 1 100%" : "auto" })} />
            <button onClick={handleAdd} disabled={saving}
              style={{ padding: "10px 22px", background: "linear-gradient(135deg,#0f2942,#2563eb)", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", opacity: saving ? 0.7 : 1, flex: isMobile ? "1 1 100%" : "auto" }}>
              {saving ? "Adding..." : "+ Add Branch"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>💡 Auto-converted to uppercase</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
            {departments.map(function (dept, i) {
              return (
                <div key={dept} style={{ background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#0284c7" }}>{dept}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Branch #{i + 1}</div>
                  </div>
                  <button onClick={function () { setConfirmDel(dept); }}
                    style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>✕</button>
                </div>
              );
            })}
          </div>
          {departments.length === 0 && <EmptyState label="No branches yet" />}
        </div>
      </div>
      {confirmDel && (
        <Modal onClose={function () { setConfirmDel(null); }} width={380} isMobile={isMobile}>
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🏫</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f2942", marginBottom: 8 }}>Delete "{confirmDel}" branch?</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Existing records won't be affected, but it won't appear in new forms.</div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={function () { setConfirmDel(null); }} style={{ padding: "10px 24px", background: "#f1f5f9", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={function () { handleDelete(confirmDel); }} style={{ padding: "10px 24px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── UsersPanel ────────────────────────────────────────────────────────────────
function UsersPanel({ users, setUsers, setDemoUsers, showToast, data, setData, departments, isMobile }) {
  const [viewTab, setViewTab] = useState("active"); // "active" | "archived"
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [loadingActive, setLoadingActive] = useState(false);
  const [inspectUserPubs, setInspectUserPubs] = useState(null); // { user, publications }
  const [loadingPubs, setLoadingPubs] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "faculty", dept: departments[0] || "CSE", facultyId: "" });
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchActiveUsers = useCallback(async function () {
    setLoadingActive(true);
    try {
      const res = await api.get('/api/users');
      if (Array.isArray(res)) {
        setUsers(res);
      }
    } catch (e) {
      showToast("Failed to load active users: " + e.message, "error");
    } finally {
      setLoadingActive(false);
    }
  }, [setUsers, showToast]);

  const fetchArchivedUsers = useCallback(async function () {
    setLoadingArchived(true);
    try {
      const res = await api.get('/api/users?archivedOnly=true');
      setArchivedUsers(res || []);
    } catch (e) {
      showToast("Failed to load archived users: " + e.message, "error");
    } finally {
      setLoadingArchived(false);
    }
  }, [showToast]);

  useEffect(function () {
    if (viewTab === "active") {
      fetchActiveUsers();
    } else if (viewTab === "archived") {
      fetchArchivedUsers();
    }
  }, [viewTab, fetchActiveUsers, fetchArchivedUsers]);

  async function handleUpdateUser() {
    if (!editUser) return;
    if (editUser.facultyId && !/^[A-Z0-9]+-\d{3}$/.test(editUser.facultyId.trim().toUpperCase())) {
      showToast("Faculty ID must be in format DEPT-001 (e.g. IT-001, CSE-023)", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.put('/api/users', {
        id: editUser.id,
        name: editUser.name,
        role: editUser.role,
        dept: editUser.dept,
        facultyId: editUser.facultyId
      });
      setUsers(function (p) {
        return p.map(function (u) { return u.id === updated.id ? Object.assign({}, u, updated) : u; });
      });
      if (setDemoUsers) {
        setDemoUsers(function (p) {
          return p.map(function (u) { return u.id === updated.id ? Object.assign({}, u, updated) : u; });
        });
      }
      if (updated.dept && setData) {
        setData(function (prevData) {
          const nextData = Object.assign({}, prevData);
          Object.keys(nextData).forEach(function (key) {
            if (Array.isArray(nextData[key])) {
              nextData[key] = nextData[key].map(function (r) {
                return r.submittedById === updated.id ? Object.assign({}, r, { department: updated.dept }) : r;
              });
            }
          });
          return nextData;
        });
      }
      setEditUser(null);
      showToast("User updated successfully", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
    setSaving(false);
  }

  async function handleAdd() {
    if (!form.name || !form.email || !form.password) { showToast("All fields required", "error"); return; }
    if (!form.email.endsWith("@bpitindia.edu.in")) {
      showToast("Email must end with @bpitindia.edu.in", "error");
      return;
    }
    const facIdPattern = /^[A-Z0-9]+-\d{3}$/;
    if (form.facultyId && !facIdPattern.test(form.facultyId.trim().toUpperCase())) {
      showToast("Faculty ID must be in format DEPT-001 (e.g. IT-001, CSE-023)", "error");
      return;
    }
    setSaving(true);
    try {
      const newUser = await api.post('/api/users', form);
      setUsers(function (p) { return [...p, newUser]; });
      if (setDemoUsers) {
        setDemoUsers(function (p) {
          if (p.some(function (x) { return x.email === newUser.email; })) return p;
          return [...p, newUser];
        });
      }
      setForm({ name: "", email: "", password: "", role: "faculty", dept: departments[0] || "CSE", facultyId: "" });
      setShowAdd(false);
      showToast("User added successfully", "success");
    } catch (e) { showToast(e.message, "error"); }
    setSaving(false);
  }

  async function handleRemove(id) {
    try {
      await api.del('/api/users?id=' + id);
      const removedUser = users.find(function (u) { return u.id === id; });
      setUsers(function (p) { return p.filter(function (u) { return u.id !== id; }); });
      if (removedUser) {
        setArchivedUsers(function (p) { return [...p, Object.assign({}, removedUser, { isArchived: true })]; });
      }
      showToast("User account archived (soft-deleted). All research publications preserved.", "success");
    } catch (e) { showToast(e.message, "error"); }
  }

  async function handleRestore(id) {
    try {
      const res = await api.put('/api/users', { id: id, action: 'restore' });
      const restoredUser = res.user || archivedUsers.find(function (u) { return u.id === id; });
      setArchivedUsers(function (p) { return p.filter(function (u) { return u.id !== id; }); });
      if (restoredUser) {
        setUsers(function (p) { return [...p, Object.assign({}, restoredUser, { isArchived: false })]; });
      }
      showToast("User account restored successfully!", "success");
    } catch (e) { showToast(e.message, "error"); }
  }

  async function handlePermanentDelete(id) {
    if (!window.confirm("WARNING: Are you sure you want to PERMANENTLY delete this user? This will remove the account from the database.")) return;
    try {
      await api.del('/api/users?id=' + id + '&permanent=true');
      setArchivedUsers(function (p) { return p.filter(function (u) { return u.id !== id; }); });
      showToast("User permanently deleted", "info");
    } catch (e) { showToast(e.message, "error"); }
  }

  async function handleInspectPubs(id) {
    setLoadingPubs(true);
    try {
      const res = await api.get('/api/users?userPublicationsId=' + id);
      setInspectUserPubs(res);
    } catch (e) {
      showToast("Failed to load user publications: " + e.message, "error");
    } finally {
      setLoadingPubs(false);
    }
  }

  async function handleResetPassword() {
    if (!resetUser) return;
    if (!resetPassword || !resetConfirm) {
      showToast("Enter and confirm the new password", "error");
      return;
    }
    if (resetPassword !== resetConfirm) {
      showToast("Passwords do not match", "error");
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/users', { id: resetUser.id, password: resetPassword });
      setResetUser(null);
      setResetPassword("");
      setResetConfirm("");
      showToast("Password updated successfully", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
    setSaving(false);
  }

  function getFacultyStats(uid) {
    const FC = getFieldConfigs(departments);
    const stats = {};
    let total = 0;
    Object.entries(FC).forEach(function (entry) {
      const key = entry[0]; const cfg = entry[1];
      const recs = (data[key] || []).filter(function (r) { return r.submittedById === uid; });
      stats[key] = { count: recs.length, records: recs, title: cfg.title, color: cfg.color };
      total += recs.length;
    });
    return { stats, total };
  }

  function handleExportProfiles() {
    if (!users || users.length === 0) {
      showToast("No users to export", "error");
      return;
    }

    const exportData = users.map(function (u) {
      const f = u.faculty || {};
      return {
        "User ID": u.id,
        "Name": u.name,
        "Email": u.email,
        "Role": u.role,
        "Department": u.dept,
        "Faculty ID": u.facultyId,
        "Title": f.title || "",
        "First Name": f.firstName || "",
        "Middle Name": f.middleName || "",
        "Last Name": f.lastName || "",
        "Gender": f.gender || "",
        "Date of Birth": f.dob ? new Date(f.dob).toLocaleDateString() : "",
        "Mobile": f.mobile || "",
        "Present Designation": f.presentDesig || "",
        "Date of Joining": f.doj ? new Date(f.doj).toLocaleDateString() : "",
        "Category": f.category || "",
        "Blood Group": f.bloodGroup || "",
        "Aadhaar No": f.aadhaarNo || "",
        "PAN No": f.panNo || "",
        "Nationality": f.nationality || "",
        "Father's Name": f.fatherName || "",
        "Mother's Name": f.motherName || "",
        "Present Address": [f.presentAddrHNoFloor, f.presentAddrStreetArea, f.presentAddrCity, f.presentAddrDistrict, f.presentAddrCountry, f.presentAddrPin].filter(Boolean).join(", "),
        "Permanent Address": [f.permanentAddrHNoFloor, f.permanentAddrStreetArea, f.permanentAddrCity, f.permanentAddrDistrict, f.permanentAddrCountry, f.permanentAddrPin].filter(Boolean).join(", ")
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty Profiles");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Faculty_Profiles_Export_" + Date.now() + ".xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Export successful!", "success");
  }

  function downloadCSVTemplate() {
    const headers = ["Full Name", "Email", "Role", "Department", "Faculty ID"];
    const rows = [
      ["John Doe", "johndoe@bpitindia.edu.in", "faculty", "CSE", "CSE-001"],
      ["Jane Smith", "janesmith@bpitindia.edu.in", "faculty", "IT", ""]
    ];
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(function (r) { return r.map(function (val) { return `"${val}"`; }).join(","); })].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "bpit_user_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length < 2) {
          showToast("CSV file is empty or missing headers", "error");
          return;
        }

        const headers = json[0].map(function (h) { return String(h || "").trim().toLowerCase(); });

        const nameIdx = headers.findIndex(function (h) { return h.includes("name"); });
        const emailIdx = headers.findIndex(function (h) { return h.includes("email"); });
        const roleIdx = headers.findIndex(function (h) { return h.includes("role"); });
        const deptIdx = headers.findIndex(function (h) { return h.includes("dept") || h.includes("department"); });
        const facIdIdx = headers.findIndex(function (h) { return h.includes("faculty id") || h.includes("facultyid"); });

        if (nameIdx === -1 || emailIdx === -1 || deptIdx === -1) {
          showToast("Required columns missing. CSV must contain Full Name, Email, Department.", "error");
          return;
        }

        const parsedUsers = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0) continue;

          const name = String(row[nameIdx] || "").trim();
          const email = String(row[emailIdx] || "").trim();
          const password = Math.random().toString(36).slice(-8);
          const role = roleIdx !== -1 ? String(row[roleIdx] || "faculty").trim().toLowerCase() : "faculty";
          const dept = String(row[deptIdx] || "").trim().toUpperCase();
          const facultyId = facIdIdx !== -1 ? String(row[facIdIdx] || "").trim().toUpperCase() : "";

          if (!name && !email) continue;

          if (!name || !email || !dept) {
            showToast(`Row ${i + 1} has missing required fields (Name, Email, Department)`, "error");
            return;
          }

          parsedUsers.push({ name, email, password, role, dept, facultyId });
        }

        if (parsedUsers.length === 0) {
          showToast("No valid user records found in CSV", "error");
          return;
        }

        setSaving(true);
        const res = await api.post("/api/users", { action: "bulk", users: parsedUsers });

        if (res.addedUsers && res.addedUsers.length > 0) {
          setUsers(function (p) {
            const existingIds = new Set(p.map(function (u) { return u.id; }));
            const newUsers = res.addedUsers.filter(function (u) { return !existingIds.has(u.id); });
            return [...p, ...newUsers];
          });
          if (setDemoUsers) {
            setDemoUsers(function (p) {
              const existingEmails = new Set(p.map(function (u) { return u.email.toLowerCase(); }));
              const newDemo = res.addedUsers
                .filter(function (u) { return !existingEmails.has(u.email.toLowerCase()); })
                .map(function (u) { return { id: u.id, name: u.name, email: u.email, role: u.role, dept: u.dept }; });
              return [...p, ...newDemo];
            });
          }
        }

        const failedCount = res.failed ? res.failed.length : 0;
        const createdCount = res.created || 0;

        if (failedCount > 0) {
          const firstFail = res.failed[0];
          showToast(`Bulk Import: Created ${createdCount} users. ${failedCount} failed (e.g. ${firstFail.email}: ${firstFail.reason}).`, "error");
        } else {
          showToast(`Successfully imported all ${createdCount} users!`, "success");
        }
      } catch (err) {
        showToast("Error processing CSV: " + err.message, "error");
      } finally {
        setSaving(false);
        e.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div>
      {/* Top View Selector Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          onClick={function () { setViewTab("active"); }}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer",
            background: viewTab === "active" ? "#0f2942" : "#fff",
            color: viewTab === "active" ? "#fff" : "#64748b",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}
        >
          👥 Active Users ({users.length})
        </button>
        <button
          onClick={function () { setViewTab("archived"); }}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer",
            background: viewTab === "archived" ? "#7c2d12" : "#fff",
            color: viewTab === "archived" ? "#fff" : "#64748b",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}
        >
          📦 Archived / Deleted Users ({archivedUsers.length})
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: viewTab === "active" ? "#0f2942" : "#7c2d12", fontSize: 16 }}>
              {viewTab === "active" ? `Active System Users (${users.length})` : `Archived User Accounts (${archivedUsers.length})`}
            </div>
            {viewTab === "archived" && (
              <div style={{ fontSize: 12, color: "#9a3412", marginTop: 2, fontWeight: 600 }}>
                Deleted users are soft-deleted. Their research publications remain completely preserved in the database.
              </div>
            )}
          </div>

          {viewTab === "active" ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={fetchActiveUsers} disabled={loadingActive} style={{ padding: "8px 14px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{loadingActive ? "Refreshing..." : "🔄 Refresh List"}</button>
              <button onClick={handleExportProfiles} style={{ padding: "8px 14px", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📥 Export Profiles</button>
              <button onClick={downloadCSVTemplate} style={{ padding: "8px 14px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📋 Template</button>
              <button onClick={function () { document.getElementById("csv-file-input").click(); }} style={{ padding: "8px 14px", background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📤 Import CSV</button>
              <input type="file" id="csv-file-input" onChange={handleCSVUpload} accept=".csv" style={{ display: "none" }} />
              <button onClick={function () { setShowAdd(!showAdd); }} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#0f2942,#2563eb)", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add User</button>
            </div>
          ) : (
            <button onClick={fetchArchivedUsers} disabled={loadingArchived} style={{ padding: "8px 14px", background: "#ffedd5", color: "#9a3412", border: "1px solid #fed7aa", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {loadingArchived ? "Refreshing..." : "🔄 Refresh Archive"}
            </button>
          )}
        </div>

        {viewTab === "active" && showAdd && (
          <div style={{ padding: 20, background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 12 }}>
              {[["name", "Full Name", "text"], ["email", "Email", "email"], ["password", "Password", "password"]].map(function (arr) {
                const n = arr[0]; const l = arr[1]; const t = arr[2];
                return (
                  <div key={n}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>{l}</label>
                    <input type={t} value={form[n]} onChange={function (e) { setForm(function (p) { const nx = Object.assign({}, p); nx[n] = e.target.value; return nx; }); }} style={INPUT} placeholder={l} />
                  </div>
                );
              })}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Role</label>
                <select value={form.role} onChange={function (e) { setForm(function (p) { return Object.assign({}, p, { role: e.target.value }); }); }} style={INPUT}>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Department</label>
                <select value={form.dept} onChange={function (e) {
                  const d = e.target.value;
                  setForm(function (p) {
                    const suggested = d.toUpperCase() + "-";
                    const currentId = p.facultyId || "";
                    const newId = suggested;
                    return Object.assign({}, p, { dept: d, facultyId: currentId.startsWith(p.dept.toUpperCase() + "-") ? newId : currentId });
                  });
                }} style={INPUT}>
                  {departments.map(function (d) { return <option key={d}>{d}</option>; })}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Faculty ID <span style={{ color: "#94a3b8", fontWeight: 400 }}>(format: {(form.dept || "DEPT").toUpperCase()}-001)</span>
                </label>
                <input
                  type="text"
                  value={form.facultyId}
                  onChange={function (e) { setForm(function (p) { return Object.assign({}, p, { facultyId: e.target.value.toUpperCase() }); }); }}
                  style={Object.assign({}, INPUT, {
                    borderColor: form.facultyId && !/^[A-Z0-9]+-\d{3}$/.test(form.facultyId) ? "#ef4444" : "#e2e8f0"
                  })}
                  placeholder={(form.dept || "DEPT").toUpperCase() + "-001"}
                />
                {form.facultyId && !/^[A-Z0-9]+-\d{3}$/.test(form.facultyId) && (
                  <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>Format must be DEPT-001 (e.g. {(form.dept || "DEPT").toUpperCase()}-001)</div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: isMobile ? "wrap" : "nowrap" }}>
              <button onClick={handleAdd} disabled={saving} style={{ padding: "9px 18px", background: "#059669", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1, flex: isMobile ? "1" : "auto" }}>{saving ? "Saving..." : "Save User"}</button>
              <button onClick={function () { setShowAdd(false); }} style={{ padding: "9px 18px", background: "#f1f5f9", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", flex: isMobile ? "1" : "auto" }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          {viewTab === "active" ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["#", "Name", "Email", "Faculty ID", "Role", "Department", "Total Publications", "Actions"].map(function (h) { return <th key={h} style={TH}>{h}</th>; })}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                      {loadingActive ? "Loading active users..." : "No active users found."}
                    </td>
                  </tr>
                ) : (
                  users.map(function (u, i) {
                    const fs = getFacultyStats(u.id);
                    return (
                      <tr key={u.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                        <td style={Object.assign({}, TD, { color: "#cbd5e1", fontWeight: 700, fontSize: 12 })}>{i + 1}</td>
                        <td style={TD}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0f2942,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{u.name ? u.name[0] : 'U'}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                              {u.role === 'admin' && (
                                <div style={{ fontSize: 11, color: "#475569", marginTop: 4, fontWeight: 700 }}>{u.name === 'Principal' ? 'Principal account — full admin rights' : 'Admin account — full admin rights'}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={Object.assign({}, TD, { fontSize: 12, color: "#64748b" })}>{u.email}</td>
                        <td style={TD}><span style={{ fontSize: 12, fontWeight: 600 }}>{u.facultyId}</span></td>
                        <td style={TD}><Badge text={u.role} /></td>
                        <td style={TD}><span style={{ fontSize: 12, fontWeight: 600 }}>{u.dept}</span></td>
                        <td style={TD}>
                          <span style={{ fontWeight: 800, fontSize: 16, color: fs.total > 0 ? "#0284c7" : "#cbd5e1" }}>{fs.total}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>records</span>
                        </td>
                        <td style={Object.assign({}, TD, { whiteSpace: "nowrap" })}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button onClick={function () { setSelectedFaculty(u); }} style={Btn("view")}>View Publications</button>
                            <button onClick={function () { printResume(u, u.faculty); }} style={Object.assign({}, Btn("view"), { background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" })}>Print Resume</button>
                            <button onClick={function () { setEditUser(Object.assign({}, u)); }} style={Object.assign({}, Btn("edit"), { background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" })}>Edit Role/Dept</button>
                            <button onClick={function () { setResetUser(u); }} style={Btn("edit")}>Reset Password</button>
                            <button onClick={function () { handleRemove(u.id); }} style={Object.assign({}, Btn("del"), { opacity: u.email === "principal@bpitindia.ac.in" ? 0.4 : 1 })} disabled={u.email === "principal@bpitindia.ac.in"}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fff7ed" }}>
                  {["#", "Name", "Email", "Faculty ID", "Role", "Department", "Status", "Actions"].map(function (h) { return <th key={h} style={TH}>{h}</th>; })}
                </tr>
              </thead>
              <tbody>
                {archivedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                      {loadingArchived ? "Loading archived users..." : "No archived users found. All accounts are currently active."}
                    </td>
                  </tr>
                ) : (
                  archivedUsers.map(function (u, i) {
                    return (
                      <tr key={u.id} style={{ background: i % 2 === 0 ? "#fff" : "#fffbf5" }}>
                        <td style={Object.assign({}, TD, { color: "#cbd5e1", fontWeight: 700, fontSize: 12 })}>{i + 1}</td>
                        <td style={TD}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#9a3412", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{u.name ? u.name[0] : 'U'}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: "#431407" }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: "#9a3412", fontWeight: 600 }}>Archived Account</div>
                            </div>
                          </div>
                        </td>
                        <td style={Object.assign({}, TD, { fontSize: 12, color: "#64748b" })}>{u.email}</td>
                        <td style={TD}><span style={{ fontSize: 12, fontWeight: 600 }}>{u.facultyId || "—"}</span></td>
                        <td style={TD}><Badge text={u.role} /></td>
                        <td style={TD}><span style={{ fontSize: 12, fontWeight: 600 }}>{u.dept}</span></td>
                        <td style={TD}>
                          <span style={{ padding: "3px 8px", background: "#ffedd5", color: "#9a3412", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            📦 Soft Deleted
                          </span>
                        </td>
                        <td style={Object.assign({}, TD, { whiteSpace: "nowrap" })}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              onClick={function () { handleRestore(u.id); }}
                              style={{ padding: "6px 12px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                            >
                              🔄 Restore User
                            </button>
                            <button
                              onClick={function () { handleInspectPubs(u.id); }}
                              disabled={loadingPubs}
                              style={{ padding: "6px 12px", background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                            >
                              📄 Inspect Publications
                            </button>
                            <button
                              onClick={function () { handlePermanentDelete(u.id); }}
                              style={{ padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                            >
                              ❌ Delete Permanently
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {resetUser && (
        <Modal onClose={function () { setResetUser(null); setResetPassword(""); setResetConfirm(""); }} width={420} isMobile={isMobile}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f2942", marginBottom: 16 }}>Reset Password for {resetUser.name}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Enter a new password for this user. The old password cannot be retrieved for security reasons.</div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 20, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 12, borderRadius: 10 }}>
            A password update will send an email notification to the user if SMTP is configured. If email delivery is not configured, the reset details are logged on the server for local/demo use.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>New Password</label>
              <input type="password" value={resetPassword} onChange={function (e) { setResetPassword(e.target.value); }} style={INPUT} placeholder="New password" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Confirm Password</label>
              <input type="password" value={resetConfirm} onChange={function (e) { setResetConfirm(e.target.value); }} style={INPUT} placeholder="Confirm new password" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button onClick={function () { setResetUser(null); setResetPassword(""); setResetConfirm(""); }} style={{ padding: "10px 22px", background: "#f1f5f9", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleResetPassword} disabled={saving} style={{ padding: "10px 22px", background: "#059669", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving..." : "Update Password"}</button>
          </div>
        </Modal>
      )}

      {editUser && (
        <Modal onClose={function () { setEditUser(null); }} width={480} isMobile={isMobile}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f2942", marginBottom: 16 }}>Edit User Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Full Name</label>
              <input
                type="text"
                value={editUser.name || ""}
                onChange={function (e) {
                  const val = e.target.value;
                  setEditUser(function (p) { return Object.assign({}, p, { name: val }); });
                }}
                style={INPUT}
                placeholder="Full Name"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Role</label>
              <select
                value={editUser.role || "faculty"}
                onChange={function (e) {
                  const val = e.target.value;
                  setEditUser(function (p) { return Object.assign({}, p, { role: val }); });
                }}
                style={INPUT}
              >
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Department</label>
              <select
                value={editUser.dept || ""}
                onChange={function (e) {
                  const newDept = e.target.value;
                  setEditUser(function (p) {
                    return Object.assign({}, p, { dept: newDept });
                  });
                }}
                style={INPUT}
              >
                {departments.map(function (d) {
                  return <option key={d} value={d}>{d}</option>;
                })}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                Faculty ID <span style={{ color: "#94a3b8", fontWeight: 400 }}>(format: {(editUser.dept || "DEPT").toUpperCase()}-001)</span>
              </label>
              <input
                type="text"
                value={editUser.facultyId || ""}
                onChange={function (e) {
                  const val = e.target.value.toUpperCase();
                  setEditUser(function (p) { return Object.assign({}, p, { facultyId: val }); });
                }}
                style={Object.assign({}, INPUT, {
                  borderColor: editUser.facultyId && !/^[A-Z0-9]+-\d{3}$/.test(editUser.facultyId) ? "#ef4444" : "#e2e8f0"
                })}
                placeholder={(editUser.dept || "DEPT").toUpperCase() + "-001"}
              />
              {editUser.facultyId && !/^[A-Z0-9]+-\d{3}$/.test(editUser.facultyId) && (
                <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>
                  Format must be DEPT-001 (e.g. {(editUser.dept || "DEPT").toUpperCase()}-001)
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              onClick={function () { setEditUser(null); }}
              style={{ padding: "10px 22px", background: "#f1f5f9", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateUser}
              disabled={saving}
              style={{ padding: "10px 22px", background: "#059669", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* Archived User Publication Inspector Modal */}
      {inspectUserPubs && (
        <Modal onClose={function () { setInspectUserPubs(null); }} width={800} isMobile={isMobile}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#0f2942" }}>
                📄 Research Publications (Archived User: {inspectUserPubs.user.name})
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                Email: {inspectUserPubs.user.email} • Dept: {inspectUserPubs.user.dept} • Faculty ID: {inspectUserPubs.user.facultyId || "N/A"}
              </div>
            </div>
            <button onClick={function () { setInspectUserPubs(null); }} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, color: "#64748b" }}>✕</button>
          </div>

          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 12, color: "#9a3412", fontWeight: 600 }}>
            🔒 These publications are preserved even though the user account is archived/deleted.
          </div>

          <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 4 }}>
            {[
              { label: "Journals", list: inspectUserPubs.publications.journals, keyTitle: "paperTitle", keyVenue: "journalName" },
              { label: "Patents", list: inspectUserPubs.publications.patents, keyTitle: "title", keyVenue: "patentOffice" },
              { label: "Conferences", list: inspectUserPubs.publications.conferences, keyTitle: "paperTitle", keyVenue: "conferenceName" },
              { label: "FDPs / Workshops", list: inspectUserPubs.publications.fdps, keyTitle: "title", keyVenue: "organizer" },
              { label: "Books", list: inspectUserPubs.publications.books, keyTitle: "title", keyVenue: "publisher" },
              { label: "Book Chapters", list: inspectUserPubs.publications.chapters, keyTitle: "chapterTitle", keyVenue: "bookTitle" }
            ].map(function (cat) {
              return (
                <div key={cat.label} style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0f2942", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>{cat.label}</span>
                    <span style={{ fontSize: 12, background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, color: "#475569" }}>{cat.list ? cat.list.length : 0} items</span>
                  </div>

                  {cat.list && cat.list.length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={TH}>Title / Name</th>
                          <th style={TH}>Venue / Organization</th>
                          <th style={TH}>Year</th>
                          <th style={TH}>Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.list.map(function (item, idx) {
                          return (
                            <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>
                              <td style={Object.assign({}, TD, { fontWeight: 600 })}>{item[cat.keyTitle] || item.title || "—"}</td>
                              <td style={TD}>{item[cat.keyVenue] || item.journalName || item.publisher || "—"}</td>
                              <td style={TD}><Badge text={item.academicYear || item.year || "—"} /></td>
                              <td style={TD}>{item.department || inspectUserPubs.user.dept}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", padding: "6px 0" }}>No {cat.label.toLowerCase()} records submitted.</div>
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {selectedFaculty && (function () {
        const FC = getFieldConfigs(departments);
        const fs2 = getFacultyStats(selectedFaculty.id);
        const stats = fs2.stats; const total = fs2.total;

        function exportFacultyExcel() {
          const wb = XLSX.utils.book_new();
          Object.entries(stats).forEach(function (entry) {
            const key = entry[0]; const s = entry[1];
            if (!s.count) return;
            const cfg = FC[key];
            const headers = cfg.fields.map(function (f) { return f.label; });
            const rows = s.records.map(function (r) { return cfg.fields.map(function (f) { return r[f.name] || ""; }); });
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            ws["!cols"] = headers.map(function () { return { wch: 20 }; });
            XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(cfg.title));
          });
          XLSX.writeFile(wb, selectedFaculty.name.replace(/\s+/g, "_") + "_Publications_" + Date.now() + ".xlsx");
        }

        function exportFacultyPDF() {
          const html = "<!DOCTYPE html><html><head><title>" + selectedFaculty.name + "</title><style>body{font-family:Arial;margin:20px;font-size:11px}h1{color:#1e3a5f;font-size:18px}h2{font-size:13px;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px;margin-top:20px}table{width:100%;border-collapse:collapse;margin-top:6px}th{background:#1e3a5f;color:#fff;padding:7px;text-align:left;font-size:10px}td{padding:6px;border-bottom:1px solid #e5e7eb;font-size:10px}</style></head><body>"
            + "<h1>" + selectedFaculty.name + " — Research Publications</h1>"
            + "<p style='color:#555;font-size:11px'>Dept: " + selectedFaculty.dept + " | Email: " + selectedFaculty.email + " | Total: " + total + " | " + new Date().toLocaleString() + "</p>"
            + Object.entries(stats).filter(function (e) { return e[1].count > 0; }).map(function (entry) {
              const key = entry[0]; const s = entry[1]; const cfg = FC[key];
              const cols = cfg.columns.slice(0, 5); const lbls = cfg.colLabels.slice(0, 5);
              return "<h2>" + s.title + " (" + s.count + ")</h2><table><thead><tr>" + lbls.map(function (l) { return "<th>" + l + "</th>"; }).join("") + "<th>Year</th></tr></thead><tbody>" + s.records.map(function (r) { return "<tr>" + cols.map(function (c) { return "<td>" + (r[c] || "—") + "</td>"; }).join("") + "<td>" + (r.academicYear || "—") + "</td></tr>"; }).join("") + "</tbody></table>";
            }).join("")
            + "</body></html>";
          const w = window.open("", "_blank");
          w.document.write(html);
          w.document.close();
          w.onload = function () { w.print(); };
        }

        return (
          <Modal onClose={function () { setSelectedFaculty(null); }} width={780} isMobile={isMobile}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#0f2942,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 20 }}>{selectedFaculty.name[0]}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#0f2942" }}>{selectedFaculty.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{selectedFaculty.email} • {selectedFaculty.dept}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {total > 0 && <button onClick={exportFacultyExcel} style={{ padding: "7px 14px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>⬇ Excel</button>}
                {total > 0 && <button onClick={exportFacultyPDF} style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>🖨 PDF</button>}
                <button onClick={function () { setSelectedFaculty(null); }} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, color: "#64748b" }}>✕</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
              <div style={{ background: "linear-gradient(135deg,#0f2942,#1e3a5f)", borderRadius: 12, padding: "14px 16px", gridColumn: "span 3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 13 }}>Total Publications</span>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 28 }}>{total}</span>
              </div>
              {Object.entries(stats).filter(function (e) { return e[1].count > 0; }).map(function (e) {
                const key = e[0]; const s = e[1];
                return (
                  <div key={key} style={{ background: s.color + "10", border: "1.5px solid " + s.color + "30", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.title}</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.count}</span>
                  </div>
                );
              })}
            </div>
            {Object.entries(stats).filter(function (e) { return e[1].count > 0; }).map(function (e) {
              const key = e[0]; const s = e[1];
              const mod = MODULE_CONFIG.find(function (m) { return m.id === key; });
              return (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "8px 12px", background: s.color + "10", borderRadius: 8, borderLeft: "3px solid " + s.color }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: s.color }}>{mod ? mod.icon : ""} {s.title}</span>
                    <span style={{ marginLeft: "auto", fontWeight: 800, color: s.color, fontSize: 13 }}>{s.count} record{s.count !== 1 ? "s" : ""}</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: "#f8fafc" }}>
                      {FC[key].colLabels.slice(0, 5).map(function (l) { return <th key={l} style={TH}>{l}</th>; })}
                      <th style={TH}>Year</th>
                    </tr></thead>
                    <tbody>
                      {s.records.map(function (r, i) {
                        return (
                          <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                            {FC[key].columns.slice(0, 5).map(function (col) {
                              return <td key={col} style={Object.assign({}, TD, { maxWidth: 160 })}>
                                {STATUS_COLORS[r[col]] ? <Badge text={r[col]} /> : <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r[col]}>{r[col] || "—"}</span>}
                              </td>;
                            })}
                            <td style={TD}><Badge text={r.academicYear || "—"} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
            {total === 0 && <EmptyState label="No publications for this faculty" />}
          </Modal>
        );
      })()}
    </div>
  );
}

// ── ReportsPanel ──────────────────────────────────────────────────────────────
function ReportsPanel({ data, users, filterYear, FIELD_CONFIGS, showToast, isMobile }) {
  const [viewMode, setViewMode] = useState("summary"); // 'summary' | 'details'
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDept, setSelectedDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Consolidated summary calculation for Summary View
  const summary = useMemo(function () {
    return Object.entries(FIELD_CONFIGS).map(function (entry) {
      const key = entry[0]; const cfg = entry[1];
      const recs = (data[key] || []).filter(function (r) { return filterYear === "All" || r.academicYear === filterYear; });
      const byDept = {};
      recs.forEach(function (r) {
        const submitter = (users || []).find(function (u) { return u.id === r.submittedById; });
        let dept = r.department;
        if (!dept && submitter) dept = submitter.dept;
        if (dept === 'Administration') dept = 'Principal';
        dept = dept || 'Unknown';
        byDept[dept] = (byDept[dept] || 0) + 1;
      });
      return { key, title: cfg.title, total: recs.length, byDept, color: cfg.color };
    });
  }, [data, FIELD_CONFIGS, filterYear, users]);

  // Consolidated departments list
  const allDepts = useMemo(function () {
    const depts = new Set(["All"]);
    (users || []).forEach(function (u) { if (u.dept) depts.add(u.dept); });
    Object.values(data || {}).forEach(function (recs) {
      if (Array.isArray(recs)) {
        recs.forEach(function (r) { if (r.department) depts.add(r.department); });
      }
    });
    return Array.from(depts);
  }, [users, data]);

  // Consolidated all individual records list for Detailed Records View
  const allRecords = useMemo(function () {
    const list = [];
    Object.entries(FIELD_CONFIGS).forEach(function (entry) {
      const modKey = entry[0]; const cfg = entry[1];
      const items = data[modKey] || [];
      items.forEach(function (r) {
        const submitter = (users || []).find(function (u) { return u.id === r.submittedById; });
        let dept = r.department;
        if (!dept && submitter) dept = submitter.dept;
        if (dept === 'Administration') dept = 'Principal';
        dept = dept || 'Unknown';

        const recordTitle = r.paperTitle || r.title || r.patentTitle || r.bookTitle || r.chapterTitle || r.eventTitle || r.topic || r.name || "Untitled Record";

        list.push(Object.assign({}, r, {
          _modKey: modKey,
          _modTitle: cfg.title,
          _modColor: cfg.color,
          _effectiveDept: dept,
          _submitterName: r.submittedByName || (submitter ? submitter.name : "Unknown"),
          _submitterEmail: submitter ? submitter.email : "",
          _displayTitle: recordTitle
        }));
      });
    });
    return list;
  }, [data, FIELD_CONFIGS, users]);

  // Filtered records based on active year, category, dept, search
  const filteredRecords = useMemo(function () {
    return allRecords.filter(function (r) {
      if (filterYear !== "All" && r.academicYear !== filterYear) return false;
      if (selectedCategory !== "all" && r._modKey !== selectedCategory) return false;
      if (selectedDept !== "All" && r._effectiveDept !== selectedDept) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (r._displayTitle || "").toLowerCase().includes(q);
        const submitterMatch = (r._submitterName || "").toLowerCase().includes(q);
        const deptMatch = (r._effectiveDept || "").toLowerCase().includes(q);
        const venueMatch = (r.journalName || r.confName || r.publisherName || r.organizer || r.patentNumber || r.doi || "").toLowerCase().includes(q);
        if (!titleMatch && !submitterMatch && !deptMatch && !venueMatch) return false;
      }
      return true;
    });
  }, [allRecords, filterYear, selectedCategory, selectedDept, searchQuery]);

  // Pagination for Detailed Records
  const effectivePageSize = pageSize === "all" ? filteredRecords.length : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / (effectivePageSize || 1)));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === "all" ? filteredRecords.length : Math.min(startIndex + effectivePageSize, filteredRecords.length);
  const paginatedRecords = pageSize === "all" ? filteredRecords : filteredRecords.slice(startIndex, endIndex);

  // Reset page to 1 when filters change
  useEffect(function () {
    setCurrentPage(1);
  }, [selectedCategory, selectedDept, searchQuery, pageSize, filterYear]);

  function buildSummaryHTML() {
    return "<!DOCTYPE html><html><head><title>Research Summary Report</title><style>body{font-family:Arial,sans-serif;margin:20px;font-size:11px}h1{color:#1e3a5f;font-size:20px}h2{font-size:14px;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px;margin-top:20px}table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#1e3a5f;color:#fff;padding:7px;text-align:left}td{padding:6px;border-bottom:1px solid #e5e7eb}tr:nth-child(even) td{background:#f8fafc}</style></head><body><h1>BPIT — Research Summary Report</h1><p style='color:#555;font-size:12px'>Year: " + filterYear + " | Generated: " + new Date().toLocaleString() + "</p>" + summary.map(function (s) { return "<h2>" + s.title + " (" + s.total + ")</h2><table><thead><tr><th>Department</th><th>Count</th></tr></thead><tbody>" + Object.entries(s.byDept).sort(function (a, b) { return b[1] - a[1]; }).map(function (e) { return "<tr><td>" + e[0] + "</td><td><b>" + e[1] + "</b></td></tr>"; }).join("") + (Object.keys(s.byDept).length === 0 ? "<tr><td colspan='2' style='color:#888'>No records</td></tr>" : "") + "</tbody></table>"; }).join("") + "</body></html>";
  }

  function buildDetailedHTML() {
    const rows = filteredRecords.map(function (r, idx) {
      const venue = r.journalName || r.confName || r.publisherName || r.organizer || r.patentNumber || "—";
      const indexing = r.indexing || r.patentStatus || r.role || "—";
      return "<tr>" +
        "<td>" + (idx + 1) + "</td>" +
        "<td><b>" + (r._modTitle || r._modKey) + "</b></td>" +
        "<td><b>" + (r._displayTitle) + "</b></td>" +
        "<td><b>" + (r._submitterName || "—") + "</b><br/><span style='color:#666;font-size:10px'>" + (r._effectiveDept || "—") + "</span></td>" +
        "<td>" + (r.academicYear || "—") + "</td>" +
        "<td>" + venue + "</td>" +
        "<td>" + indexing + "</td>" +
        "</tr>";
    }).join("");

    return "<!DOCTYPE html><html><head><title>Full Detailed Research Report</title><style>body{font-family:Arial,sans-serif;margin:20px;font-size:11px}h1{color:#1e3a5f;font-size:18px;margin-bottom:4px}p{color:#555;font-size:11px;margin-top:0}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#1e3a5f;color:#fff;padding:8px;text-align:left;font-size:10px}td{padding:6px;border-bottom:1px solid #e5e7eb;font-size:10px}tr:nth-child(even) td{background:#f8fafc}</style></head><body><h1>BPIT — Comprehensive Research Details Report</h1><p>Academic Year: " + filterYear + " | Category: " + (selectedCategory === "all" ? "All Categories" : (FIELD_CONFIGS[selectedCategory] ? FIELD_CONFIGS[selectedCategory].title : selectedCategory)) + " | Dept: " + selectedDept + " | Total Records: " + filteredRecords.length + " | Generated: " + new Date().toLocaleString() + "</p><table><thead><tr><th>#</th><th>Category</th><th>Title / Work</th><th>Faculty Submitter</th><th>Year</th><th>Journal / Publisher / Venue</th><th>Indexing / Info</th></tr></thead><tbody>" + (rows || "<tr><td colspan='7' style='text-align:center;color:#999;'>No research records found</td></tr>") + "</tbody></table></body></html>";
  }

  function handlePrint(type) {
    const html = type === "summary" ? buildSummaryHTML() : buildDetailedHTML();
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.onload = function () { w.print(); };
  }

  return (
    <div>
      {/* Top Header Bar with Mode Switcher & Export/Print Actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>
            📊 Research Reports & Analytics — {filterYear === "All" ? "All Years" : filterYear}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Switch between summary department counts or inspect all individual publication records.
          </div>
        </div>

        {/* View Switcher: Summary vs Detailed Records */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", borderRadius: 10, border: "1px solid var(--border-color)", overflow: "hidden", background: "var(--bg-surface-secondary)" }}>
            <button
              onClick={function () { setViewMode("summary"); }}
              className="btn-interactive"
              style={{
                padding: "8px 14px",
                border: "none",
                background: viewMode === "summary" ? "var(--accent-primary)" : "transparent",
                color: viewMode === "summary" ? "#fff" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              📊 Summary View
            </button>
            <button
              onClick={function () { setViewMode("details"); }}
              className="btn-interactive"
              style={{
                padding: "8px 14px",
                border: "none",
                background: viewMode === "details" ? "var(--accent-primary)" : "transparent",
                color: viewMode === "details" ? "#fff" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              📄 Full Detailed Records ({filteredRecords.length})
            </button>
          </div>

          <button
            onClick={function () { exportAllToExcel(data, FIELD_CONFIGS, filterYear, showToast); }}
            className="btn-interactive"
            style={{ padding: "8px 16px", background: "#059669", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
          >
            📥 Export Excel
          </button>

          <button
            onClick={function () { handlePrint(viewMode); }}
            className="btn-interactive"
            style={{ padding: "8px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
          >
            🖨 {viewMode === "summary" ? "Print Summary" : "Print Detailed List"}
          </button>
        </div>
      </div>

      {/* SUMMARY VIEW CONTENT */}
      {viewMode === "summary" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {summary.map(function (s) {
            return (
              <div key={s.key} style={{ background: "var(--bg-surface)", borderRadius: 14, border: "1px solid var(--border-color)", boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
                <div style={{ background: s.color, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{s.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 26, fontWeight: 900 }}>{s.total}</div>
                </div>
                <div style={{ padding: "12px 18px" }}>
                  {Object.entries(s.byDept).sort(function (a, b) { return b[1] - a[1]; }).map(function (e) {
                    return (
                      <div key={e[0]} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{e[0]}</span>
                        <span style={{ fontWeight: 800, color: s.color }}>{e[1]}</span>
                      </div>
                    );
                  })}
                  {Object.keys(s.byDept).length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 12, padding: "8px 0" }}>No records found</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED RECORDS VIEW CONTENT */}
      {viewMode === "details" && (
        <div style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-color)", padding: 20, boxShadow: "var(--card-shadow)" }}>
          {/* Controls Bar for Detailed Records */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "1", minWidth: isMobile ? 0 : 240 }}>
              <input
                value={searchQuery}
                onChange={function (e) { setSearchQuery(e.target.value); }}
                placeholder="🔍 Search title, author, journal, DOI, patent no..."
                style={Object.assign({}, INPUT, { padding: "9px 12px 9px 34px", borderRadius: 10 })}
              />
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 13, pointerEvents: "none" }}>🔍</span>
              {searchQuery && (
                <button onClick={function () { setSearchQuery(""); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>✕</button>
              )}
            </div>

            {/* Selectors: Category & Dept */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flex: isMobile ? "1 1 100%" : "none" }}>
              <select
                value={selectedCategory}
                onChange={function (e) { setSelectedCategory(e.target.value); }}
                style={Object.assign({}, INPUT, { width: "auto", padding: "8px 12px", borderRadius: 10, fontSize: 12 })}
              >
                <option value="all">Category: All Modules</option>
                {Object.entries(FIELD_CONFIGS).map(function ([k, cfg]) {
                  return <option key={k} value={k}>{cfg.title}</option>;
                })}
              </select>

              <select
                value={selectedDept}
                onChange={function (e) { setSelectedDept(e.target.value); }}
                style={Object.assign({}, INPUT, { width: "auto", padding: "8px 12px", borderRadius: 10, fontSize: 12 })}
              >
                {allDepts.map(function (d) {
                  return <option key={d} value={d}>{d === "All" ? "Dept: All Departments" : d}</option>;
                })}
              </select>

              {/* Page Size selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-surface-secondary)", padding: "2px 8px", borderRadius: 10, border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Show:</span>
                <select
                  value={pageSize}
                  onChange={function (e) { setPageSize(e.target.value === "all" ? "all" : Number(e.target.value)); }}
                  style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 12, fontWeight: 700, padding: "6px 2px", cursor: "pointer", outline: "none" }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value="all">All ({filteredRecords.length})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table of Detailed Records */}
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--border-color)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--table-th-bg)", borderBottom: "1px solid var(--border-color)" }}>
                  <th style={TH}>#</th>
                  <th style={TH}>Category</th>
                  <th style={TH}>Title / Research Work</th>
                  <th style={TH}>Faculty Submitter</th>
                  <th style={TH}>Dept</th>
                  <th style={TH}>Year</th>
                  <th style={TH}>Journal / Publisher / Venue</th>
                  <th style={TH}>Indexing / Status</th>
                  <th style={Object.assign({}, TH, { textAlign: "right" })}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map(function (rec, idx) {
                  const rowNum = startIndex + idx + 1;
                  const venue = rec.journalName || rec.confName || rec.publisherName || rec.organizer || rec.patentNumber || "—";
                  const indexing = rec.indexing || rec.patentStatus || rec.role || "—";

                  return (
                    <tr
                      key={rec.id || (rec._modKey + "-" + idx)}
                      className="row-hover"
                      onClick={function () { setViewingRecord(rec); }}
                      style={{ cursor: "pointer", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <td style={Object.assign({}, TD, { color: "var(--text-muted)", fontWeight: 700, fontSize: 12 })}>{rowNum}</td>
                      <td style={TD}>
                        <span style={{ background: rec._modColor + "20", color: rec._modColor, border: "1px solid " + rec._modColor + "40", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {rec._modTitle || rec._modKey}
                        </span>
                      </td>
                      <td style={Object.assign({}, TD, { fontWeight: 700, color: "var(--text-primary)", maxWidth: 280 })}>
                        <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {rec._displayTitle}
                        </div>
                      </td>
                      <td style={TD}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rec._submitterName}</div>
                      </td>
                      <td style={TD}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{rec._effectiveDept}</span>
                      </td>
                      <td style={TD}>
                        <span style={{ background: "rgba(37,99,235,0.08)", color: "var(--accent-primary)", padding: "2px 6px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          {rec.academicYear || "—"}
                        </span>
                      </td>
                      <td style={Object.assign({}, TD, { fontSize: 12, color: "var(--text-secondary)", maxWidth: 180 })}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {venue}
                        </div>
                      </td>
                      <td style={TD}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{indexing}</span>
                      </td>
                      <td style={Object.assign({}, TD, { textAlign: "right" })}>
                        <button
                          onClick={function (e) { e.stopPropagation(); setViewingRecord(rec); }}
                          className="btn-interactive"
                          style={{ padding: "4px 10px", background: "var(--accent-gradient)", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          🔍 Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {paginatedRecords.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "36px 16px", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>No publication records found</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing search or changing your department / category filters.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Showing {startIndex + 1}–{endIndex} of {filteredRecords.length} records
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  disabled={safeCurrentPage <= 1}
                  onClick={function () { setCurrentPage(safeCurrentPage - 1); }}
                  className="btn-interactive"
                  style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-surface-secondary)", color: "var(--text-primary)", fontWeight: 700, fontSize: 12, cursor: safeCurrentPage <= 1 ? "not-allowed" : "pointer", opacity: safeCurrentPage <= 1 ? 0.5 : 1 }}
                >
                  ◀ Prev
                </button>
                <span style={{ padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  disabled={safeCurrentPage >= totalPages}
                  onClick={function () { setCurrentPage(safeCurrentPage + 1); }}
                  className="btn-interactive"
                  style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-surface-secondary)", color: "var(--text-primary)", fontWeight: 700, fontSize: 12, cursor: safeCurrentPage >= totalPages ? "not-allowed" : "pointer", opacity: safeCurrentPage >= totalPages ? 0.5 : 1 }}
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Inspector Modal */}
      {viewingRecord && (
        <Modal onClose={function () { setViewingRecord(null); }} width={600} isMobile={isMobile}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: viewingRecord._modColor || "var(--accent-primary)", color: "#fff", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 800 }}>
                {viewingRecord._modTitle || viewingRecord._modKey}
              </span>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>Publication Details</div>
            </div>
            <button onClick={function () { setViewingRecord(null); }} style={{ background: "var(--bg-surface-secondary)", border: "none", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 15, color: "var(--text-muted)" }}>✕</button>
          </div>

          <div style={{ background: (viewingRecord._modColor || "var(--accent-primary)") + "15", borderLeft: "4px solid " + (viewingRecord._modColor || "var(--accent-primary)"), borderRadius: "0 8px 8px 0", padding: "12px 14px", marginBottom: 16, fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
            {viewingRecord._displayTitle}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 0, maxHeight: "60vh", overflowY: "auto" }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Submitted By</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{viewingRecord._submitterName} ({viewingRecord._effectiveDept})</div>
            </div>

            {Object.entries(viewingRecord).filter(function (e) {
              return !["id", "submittedById", "_modKey", "_modTitle", "_modColor", "_effectiveDept", "_submitterName", "_submitterEmail", "_displayTitle"].includes(e[0]);
            }).map(function (e) {
              const k = e[0]; const v = e[1];
              if (v === undefined || v === null || v === "") return null;
              return (
                <div key={k} style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-subtle)", gridColumn: ["paperTitle", "title", "patentTitle", "bookTitle", "chapterTitle", "authors", "inventors"].includes(k) ? "span 2" : "span 1" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 2 }}>
                    {k.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600, wordBreak: "break-word" }}>
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button onClick={function () { setViewingRecord(null); }} style={{ padding: "8px 18px", background: "var(--bg-surface-secondary)", border: "1px solid var(--border-color)", borderRadius: 8, fontWeight: 700, fontSize: 12, color: "var(--text-primary)", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Department & Faculty Detail Components for Admin Dashboard ─────────────────
function FacultyCompleteDetailModal({ faculty, data, filterYear, FIELD_CONFIGS, departments, isMobile, showToast, onClose }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(faculty.faculty || {});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [recordSearch, setRecordSearch] = useState("");
  const [viewingRecord, setViewingRecord] = useState(null);
  const [useYearFilter, setUseYearFilter] = useState(false);

  useEffect(function () {
    let isMounted = true;
    async function fetchFullProfile() {
      setLoadingProfile(true);
      try {
        const res = await api.get('/api/profile?userId=' + faculty.id);
        if (isMounted && res && res.profile) {
          setProfile(res.profile);
        }
      } catch (err) {
        // use existing faculty.faculty as fallback
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    }
    fetchFullProfile();
    return function () { isMounted = false; };
  }, [faculty.id]);

  // Compute faculty publications
  const facultySubmissions = useMemo(function () {
    const res = {};
    MODULES.forEach(function (mod) {
      const allMod = data[mod] || [];
      res[mod] = allMod.filter(function (r) {
        const matchId = r.submittedById === faculty.id;
        const matchName = r.submittedByName && faculty.name && r.submittedByName.toLowerCase().trim() === faculty.name.toLowerCase().trim();
        const matchesUser = matchId || matchName;
        if (!matchesUser) return false;
        if (useYearFilter && filterYear !== "All" && r.academicYear !== filterYear) return false;
        return true;
      });
    });
    return res;
  }, [data, faculty.id, faculty.name, useYearFilter, filterYear]);

  const totalPubs = Object.values(facultySubmissions).reduce(function (acc, list) { return acc + list.length; }, 0);

  function exportFacultyExcel() {
    const wb = XLSX.utils.book_new();
    const bioRows = [
      ["Faculty Profile Summary", ""],
      ["Generated On", new Date().toLocaleString()],
      ["Full Name", (profile.title ? profile.title + " " : "") + faculty.name],
      ["Email", faculty.email],
      ["Department", faculty.dept],
      ["Faculty ID", faculty.facultyId || ""],
      ["Designation", profile.presentDesig || faculty.role || ""],
      ["Mobile", profile.mobile || ""],
      ["Personal Email", profile.email || ""],
      ["Date of Birth", profile.dob ? new Date(profile.dob).toLocaleDateString() : ""],
      ["Date of Joining", profile.doj ? new Date(profile.doj).toLocaleDateString() : ""],
      ["Highest Degree", profile.highestDegree || ""],
      ["University", profile.university || ""],
      ["Specialization", profile.specialization || ""],
      ["Experience (Years)", profile.experienceYearsCurrInst || ""],
      ["PAN No", profile.panNo || ""],
      ["Aadhaar No", profile.aadhaarNo || ""],
      ["APAAR Faculty ID", profile.apaarFacultyId || ""],
      ["Nature of Association", profile.natureOfAssociation || ""],
      ["Contract Type", profile.contractType || ""],
      ["Total Publications", totalPubs]
    ];
    const wsBio = XLSX.utils.aoa_to_sheet(bioRows);
    wsBio["!cols"] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsBio, "Faculty Profile");

    MODULES.forEach(function (mod) {
      const records = facultySubmissions[mod] || [];
      if (!records.length) return;
      const cfg = FIELD_CONFIGS[mod];
      if (!cfg) return;
      const headers = cfg.fields.map(function (f) { return f.label; });
      const rows = records.map(function (r) { return cfg.fields.map(function (f) { return r[f.name] || ""; }); });
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = headers.map(function () { return { wch: 20 }; });
      XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(cfg.title));
    });

    downloadWorkbook(wb, (faculty.name || "Faculty").replace(/\s+/g, "_") + "_Complete_Dossier_" + Date.now() + ".xlsx");
    if (showToast) showToast("Faculty complete dossier exported to Excel", "success");
  }

  const f = profile || {};
  const currentTabRecords = MODULES.includes(activeTab) ? (facultySubmissions[activeTab] || []) : [];
  const filteredTabRecords = currentTabRecords.filter(function (r) {
    if (!recordSearch) return true;
    return Object.values(r).join(" ").toLowerCase().includes(recordSearch.toLowerCase());
  });

  return (
    <Modal onClose={onClose} width={960} isMobile={isMobile}>
      {/* Modal Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20, borderBottom: "1px solid var(--border-color)", paddingBottom: 18, flexWrap: isMobile ? "wrap" : "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: isMobile ? 48 : 58, height: isMobile ? 48 : 58, borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: isMobile ? 20 : 26, flexShrink: 0, boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}>
            {faculty.name ? faculty.name[0].toUpperCase() : "F"}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 17 : 22, fontWeight: 900, color: "var(--text-primary)" }}>
                {f.title ? f.title + " " : ""}{faculty.name}
              </h2>
              <Badge text={faculty.dept || "Department"} />
              {faculty.facultyId && <span style={{ background: "var(--bg-surface-secondary)", border: "1px solid var(--border-color)", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>ID: {faculty.facultyId}</span>}
              <span style={{ background: "rgba(37,99,235,0.1)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)30", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                {f.presentDesig || (faculty.role === "admin" ? "Administrator" : "Faculty")}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span>✉ {faculty.email}</span>
              {f.mobile && <span>📞 {f.mobile}</span>}
              {f.highestDegree && <span>🎓 {f.highestDegree} ({f.university || "University"})</span>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: isMobile ? 0 : "auto" }}>
          <button onClick={exportFacultyExcel} className="btn-interactive" style={{ padding: "7px 14px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} title="Export complete dossier to Excel">
            <span>📥</span> Excel Dossier
          </button>
          <button onClick={function () { printResume(faculty, profile); }} className="btn-interactive" style={{ padding: "7px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} title="Print formatted resume">
            <span>🖨</span> Resume
          </button>
          <button onClick={onClose} style={{ background: "var(--bg-surface-secondary)", border: "1px solid var(--border-color)", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 16, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(110px,1fr))", gap: 8, marginBottom: 18 }}>
        <div style={{ background: "var(--accent-gradient)", color: "#fff", padding: "10px 14px", borderRadius: 10, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", opacity: 0.85 }}>Total Submissions</div>
          <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>{totalPubs}</div>
        </div>
        {MODULES.map(function (mod) {
          const cfg = FIELD_CONFIGS[mod] || {};
          const cnt = (facultySubmissions[mod] || []).length;
          const isActive = activeTab === mod;
          return (
            <div
              key={mod}
              onClick={function () { setActiveTab(mod); setRecordSearch(""); }}
              className="btn-interactive"
              style={{
                background: isActive ? (cfg.color + "18") : "var(--bg-surface-secondary)",
                border: isActive ? ("2px solid " + cfg.color) : "1px solid var(--border-color)",
                padding: "8px 12px",
                borderRadius: 10,
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {cfg.title ? cfg.title.split("/")[0].trim() : mod}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: cfg.color || "var(--text-primary)" }}>
                {cnt}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs Bar */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1.5px solid var(--border-color)", paddingBottom: 6, marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        <button
          onClick={function () { setActiveTab("profile"); }}
          className="btn-interactive"
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === "profile" ? "var(--accent-primary)" : "transparent",
            color: activeTab === "profile" ? "#fff" : "var(--text-secondary)",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span>👤</span> Faculty Profile & Bio
        </button>

        {MODULES.map(function (mod) {
          const cfg = FIELD_CONFIGS[mod];
          if (!cfg) return null;
          const count = (facultySubmissions[mod] || []).length;
          const isA = activeTab === mod;
          return (
            <button
              key={mod}
              onClick={function () { setActiveTab(mod); setRecordSearch(""); }}
              className="btn-interactive"
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: isA ? (cfg.color || "var(--accent-primary)") : "transparent",
                color: isA ? "#fff" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>{mod === "journals" ? "📄" : mod === "conferences" ? "🎤" : mod === "fdp" ? "🎓" : mod === "patents" ? "🏛" : mod === "bookchapters" ? "📑" : "📚"}</span>
              <span>{cfg.title}</span>
              <span style={{ background: isA ? "rgba(255,255,255,0.25)" : "var(--bg-surface-secondary)", color: isA ? "#fff" : "var(--text-muted)", fontSize: 11, padding: "1px 6px", borderRadius: 99 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: PROFILE */}
      {activeTab === "profile" && (
        <div style={{ display: "grid", gap: 16 }}>
          {loadingProfile && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>⟳ Fetching latest profile information...</div>}

          {/* 1. Basic Personal Details */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span>👤</span> Basic & Personal Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>FULL NAME</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{[f.title, f.firstName || faculty.name, f.middleName, f.lastName].filter(Boolean).join(" ")}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>GENDER</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.gender || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>DATE OF BIRTH</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.dob ? new Date(f.dob).toLocaleDateString() : "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>PLACE OF BIRTH</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.placeOfBirth || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>CATEGORY</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.category || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>BLOOD GROUP</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.bloodGroup || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>FATHER'S NAME</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.fatherName || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>MOTHER'S NAME</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.motherName || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>SPOUSE NAME</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.spouseName || "—"}</div></div>
            </div>
          </div>

          {/* 2. Academic Qualifications */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🎓</span> Academic Qualifications & Specialization
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14, marginBottom: (f.qualifications && f.qualifications.length > 0) ? 14 : 0 }}>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>HIGHEST DEGREE</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{f.highestDegree || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>UNIVERSITY / INSTITUTE</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.university || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>AREA OF SPECIALIZATION</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.specialization || "—"}</div></div>
            </div>
            {f.qualifications && f.qualifications.length > 0 && (
              <div style={{ marginTop: 10, overflowX: "auto" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>QUALIFICATION DETAILS:</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--table-th-bg)", borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "6px 10px", textAlign: "left" }}>Degree</th>
                      <th style={{ padding: "6px 10px", textAlign: "left" }}>University / Board</th>
                      <th style={{ padding: "6px 10px", textAlign: "left" }}>Year</th>
                      <th style={{ padding: "6px 10px", textAlign: "left" }}>Percentage / CGPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.qualifications.map(function (q, idx) {
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "6px 10px", fontWeight: 600 }}>{q.degree || "—"}</td>
                          <td style={{ padding: "6px 10px" }}>{q.university || "—"}</td>
                          <td style={{ padding: "6px 10px" }}>{q.year || "—"}</td>
                          <td style={{ padding: "6px 10px" }}>{q.percentage || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Institutional Employment & Association */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🏢</span> Institutional Employment & Association
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>PRESENT DESIGNATION</div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{f.presentDesig || (faculty.role === "admin" ? "Administrator" : "Faculty")}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>PRESENT DEPARTMENT</div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-primary)", marginTop: 2 }}>{f.presentDept || faculty.dept || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>DATE OF JOINING</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.doj ? new Date(f.doj).toLocaleDateString() : "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>DESIGNATION AT JOINING</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.desigAtJoiningInst || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>EXPERIENCE IN CURRENT INST.</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.experienceYearsCurrInst ? `${f.experienceYearsCurrInst} Years` : "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>DATE DESIGNATED PROF/ASSOC PROF</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.dateDesignatedProfAssocProf ? new Date(f.dateDesignatedProfAssocProf).toLocaleDateString() : "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>NATURE OF ASSOCIATION</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.natureOfAssociation || "Regular"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>CONTRACT TYPE</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.contractType || "N/A"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>CURRENTLY ASSOCIATED?</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.currentlyAssociated || "Y"} {f.dateOfLeaving ? `(Leaving Date: ${new Date(f.dateOfLeaving).toLocaleDateString()})` : ""}</div></div>
              {f.isFyCommonFaculty && <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>1ST YEAR COMMON FACULTY</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>Yes {f.fyCommonSubject ? `(${f.fyCommonSubject})` : ""}</div></div>}
            </div>
          </div>

          {/* 4. Contact & Identity */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📇</span> Contact & Identity
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>INSTITUTIONAL EMAIL</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{faculty.email}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>PERSONAL EMAIL</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.email || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>MOBILE NO.</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.mobile || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>PAN CARD NO.</div><div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-primary)", marginTop: 2 }}>{f.panNo || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>AADHAAR NO.</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.aadhaarNo || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>APAAR FACULTY ID</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.apaarFacultyId || "—"}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>NATIONALITY</div><div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{f.nationality || "Indian"}</div></div>
            </div>
          </div>

          {/* 5. Addresses */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📍</span> Residential Addresses
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>PRESENT ADDRESS</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                  {[f.presentAddrHNoFloor, f.presentAddrStreetArea, f.presentAddrDistrict, f.presentAddrCity, f.presentAddrCountry, f.presentAddrPin].filter(Boolean).join(", ") || "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>PERMANENT ADDRESS</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                  {[f.permanentAddrHNoFloor, f.permanentAddrStreetArea, f.permanentAddrDistrict, f.permanentAddrCity, f.permanentAddrCountry, f.permanentAddrPin].filter(Boolean).join(", ") || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RESEARCH MODULES */}
      {MODULES.includes(activeTab) && (
        <div>
          {/* Module controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "100%" : 260 }}>
              <input
                value={recordSearch}
                onChange={function (e) { setRecordSearch(e.target.value); }}
                placeholder={`🔍 Filter ${FIELD_CONFIGS[activeTab] ? FIELD_CONFIGS[activeTab].title : activeTab} submissions...`}
                style={Object.assign({}, INPUT, { padding: "8px 12px" })}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={useYearFilter}
                  onChange={function (e) { setUseYearFilter(e.target.checked); }}
                  style={{ accentColor: "var(--accent-primary)" }}
                />
                Filter by Academic Year ({filterYear})
              </label>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
                {filteredTabRecords.length} record{filteredTabRecords.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {filteredTabRecords.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg-surface)", borderRadius: 12, border: "1px dashed var(--border-color)", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>No {FIELD_CONFIGS[activeTab] ? FIELD_CONFIGS[activeTab].title : activeTab} records found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>This faculty member has not filled any submissions under this module {useYearFilter ? `for year ${filterYear}` : ""}.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredTabRecords.map(function (row, idx) {
                return (
                  <div
                    key={row.id || idx}
                    style={{
                      background: "var(--bg-surface)",
                      borderRadius: 12,
                      border: "1px solid var(--border-color)",
                      padding: "16px 18px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-primary)" }}>#{idx + 1}</span>
                          {row.status && <Badge text={row.status} />}
                          {row.academicYear && <span style={{ background: "var(--bg-surface-secondary)", border: "1px solid var(--border-color)", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>AY: {row.academicYear}</span>}
                          {row.quartile && row.quartile !== "N/A" && <Badge text={row.quartile} />}
                          {row.scopus === "Yes" && <span style={{ background: "rgba(59,130,246,0.12)", color: "#2563eb", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>Scopus</span>}
                          {row.sciScie === "Yes" && <span style={{ background: "rgba(16,185,129,0.12)", color: "#059669", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>SCI/SCIE</span>}
                        </div>
                        <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.35 }}>
                          {row.title || row.bookTitle || "Submission"}
                        </h4>
                      </div>

                      <button
                        onClick={function () { setViewingRecord(row); }}
                        className="btn-interactive"
                        style={{
                          padding: "6px 12px",
                          background: "var(--bg-surface-secondary)",
                          color: "var(--accent-primary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <span>👁</span> Inspect Details
                      </button>
                    </div>

                    {/* Metadata summary */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(200px,1fr))", gap: 8, fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-surface-secondary)", padding: "10px 14px", borderRadius: 8 }}>
                      {row.journal && <div><b style={{ color: "var(--text-muted)" }}>Journal:</b> {row.journal}</div>}
                      {row.conference && <div><b style={{ color: "var(--text-muted)" }}>Conference:</b> {row.conference}</div>}
                      {row.organizer && <div><b style={{ color: "var(--text-muted)" }}>Organizer:</b> {row.organizer}</div>}
                      {row.publisher && <div><b style={{ color: "var(--text-muted)" }}>Publisher:</b> {row.publisher}</div>}
                      {row.applicationNo && <div><b style={{ color: "var(--text-muted)" }}>App No:</b> {row.applicationNo}</div>}
                      {row.authors && <div style={{ gridColumn: isMobile ? "span 1" : "span 2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.authors}><b style={{ color: "var(--text-muted)" }}>Authors:</b> {row.authors}</div>}
                      {row.year && <div><b style={{ color: "var(--text-muted)" }}>Year:</b> {row.year} {row.publicationMonth ? `(Month: ${row.publicationMonth})` : ""}</div>}
                      {row.issn && <div><b style={{ color: "var(--text-muted)" }}>ISSN:</b> {row.issn}</div>}
                      {row.isbn && <div><b style={{ color: "var(--text-muted)" }}>ISBN:</b> {row.isbn}</div>}
                      {row.duration && <div><b style={{ color: "var(--text-muted)" }}>Duration:</b> {row.duration}</div>}
                      {row.doi && (
                        <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
                          <b style={{ color: "var(--text-muted)" }}>DOI:</b>{" "}
                          <a href={row.doi.startsWith("http") ? row.doi : `https://doi.org/${row.doi}`} target="_blank" rel="noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>
                            {row.doi} ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Record Deep Inspector Sub-Modal */}
      {viewingRecord && (
        <Modal onClose={function () { setViewingRecord(null); }} width={680} isMobile={isMobile}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)" }}>
              Detailed Record View — {FIELD_CONFIGS[activeTab] ? FIELD_CONFIGS[activeTab].title : activeTab}
            </div>
            <button onClick={function () { setViewingRecord(null); }} style={{ background: "var(--bg-surface-secondary)", border: "1px solid var(--border-color)", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 15, color: "var(--text-muted)" }}>✕</button>
          </div>

          <div style={{ background: (FIELD_CONFIGS[activeTab]?.color || "#2563eb") + "12", borderLeft: "4px solid " + (FIELD_CONFIGS[activeTab]?.color || "#2563eb"), padding: "10px 14px", borderRadius: "0 8px 8px 0", marginBottom: 16, fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
            {viewingRecord.title || viewingRecord.bookTitle || "Submission Details"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>
            {FIELD_CONFIGS[activeTab] && FIELD_CONFIGS[activeTab].fields.map(function (fld) {
              const val = viewingRecord[fld.name];
              const isSpan2 = fld.span === 2 || ["title", "authors", "link", "doi", "studentDetails", "coAuthorsBPIT"].includes(fld.name);
              return (
                <div key={fld.name} style={{ gridColumn: (isMobile || !isSpan2) ? "span 1" : "span 2", background: "var(--bg-surface-secondary)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
                    {fld.label}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, wordBreak: "break-word" }}>
                    {val === undefined || val === null || val === "" ? (
                      <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Not provided</span>
                    ) : STATUS_COLORS[val] ? (
                      <Badge text={val} />
                    ) : (fld.name === "doi" || fld.name === "link") && String(val).startsWith("http") ? (
                      <a href={val} target="_blank" rel="noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 700 }}>
                        {val} ↗
                      </a>
                    ) : (
                      String(val)
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button onClick={function () { setViewingRecord(null); }} className="btn-interactive" style={{ padding: "8px 20px", background: "var(--accent-primary)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Close Inspector
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

// ── DepartmentFacultyExplorer (Rendered on Admin Dashboard) ────────────────────
function DepartmentFacultyExplorer({ users, data, departments, filterYear, FIELD_CONFIGS, isMobile, showToast, onSelectFaculty }) {
  const [selectedDept, setSelectedDept] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("pubs"); // 'pubs' | 'name'
  const [onlyActive, setOnlyActive] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
  const [pageSize, setPageSize] = useState(6); // 6 | 12 | 24 | 'all'
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination to page 1 whenever filters change
  useEffect(function () {
    setCurrentPage(1);
  }, [selectedDept, search, onlyActive, sortBy, pageSize]);

  // Consolidated departments list
  const allDepts = useMemo(function () {
    const list = new Set();
    departments.forEach(function (d) { if (d) list.add(d); });
    users.forEach(function (u) { if (u.dept) list.add(u.dept); });
    Object.values(data).forEach(function (recs) {
      if (Array.isArray(recs)) {
        recs.forEach(function (r) { if (r.department) list.add(r.department); });
      }
    });
    const sorted = Array.from(list).filter(Boolean).sort();
    return ["All", ...sorted];
  }, [departments, users, data]);

  // Compute stats per user
  const userStatsMap = useMemo(function () {
    const map = {};
    users.forEach(function (u) {
      const counts = { journals: 0, conferences: 0, fdp: 0, patents: 0, bookchapters: 0, books: 0, total: 0 };
      MODULES.forEach(function (mod) {
        const records = (data[mod] || []).filter(function (r) {
          const matchId = r.submittedById === u.id;
          const matchName = r.submittedByName && u.name && r.submittedByName.toLowerCase().trim() === u.name.toLowerCase().trim();
          const matchesUser = matchId || matchName;
          if (!matchesUser) return false;
          if (filterYear !== "All" && r.academicYear !== filterYear) return false;
          return true;
        });
        counts[mod] = records.length;
        counts.total += records.length;
      });
      map[u.id] = counts;
    });
    return map;
  }, [users, data, filterYear]);

  // Compute dept stats
  const deptStats = useMemo(function () {
    const isTargetDept = function (d) {
      if (selectedDept === "All") return true;
      return d === selectedDept;
    };

    const targetUsers = users.filter(function (u) {
      const uDept = u.dept || (u.faculty && u.faculty.presentDept) || "";
      return isTargetDept(uDept);
    });

    const modCounts = {};
    let totalAll = 0;
    MODULES.forEach(function (mod) {
      const count = (data[mod] || []).filter(function (r) {
        const rDept = r.department || (function () {
          const submitter = users.find(function (u) { return u.id === r.submittedById; });
          return submitter ? submitter.dept : "";
        })();
        const matchDept = isTargetDept(rDept);
        const matchYear = filterYear === "All" || r.academicYear === filterYear;
        return matchDept && matchYear;
      }).length;
      modCounts[mod] = count;
      totalAll += count;
    });

    return {
      facultyCount: targetUsers.length,
      modCounts,
      total: totalAll
    };
  }, [selectedDept, users, data, filterYear]);

  // Filtered and sorted faculty list
  const filteredFaculty = useMemo(function () {
    return users.filter(function (u) {
      // Dept match
      const uDept = u.dept || (u.faculty && u.faculty.presentDept) || "";
      if (selectedDept !== "All" && uDept !== selectedDept) return false;

      // Search match
      if (search) {
        const q = search.toLowerCase().trim();
        const nameMatch = (u.name || "").toLowerCase().includes(q);
        const emailMatch = (u.email || "").toLowerCase().includes(q);
        const facIdMatch = (u.facultyId || "").toLowerCase().includes(q);
        const desigMatch = ((u.faculty && u.faculty.presentDesig) || "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !facIdMatch && !desigMatch) return false;
      }

      // Active only filter
      if (onlyActive) {
        const stats = userStatsMap[u.id] || { total: 0 };
        if (stats.total === 0) return false;
      }

      return true;
    }).sort(function (a, b) {
      if (sortBy === "pubs") {
        const countA = (userStatsMap[a.id] || {}).total || 0;
        const countB = (userStatsMap[b.id] || {}).total || 0;
        if (countB !== countA) return countB - countA;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [users, selectedDept, search, onlyActive, sortBy, userStatsMap]);

  // Pagination calculation
  const effectivePageSize = pageSize === "all" ? filteredFaculty.length : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredFaculty.length / (effectivePageSize || 1)));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === "all" ? filteredFaculty.length : Math.min(startIndex + effectivePageSize, filteredFaculty.length);
  const paginatedFaculty = pageSize === "all" ? filteredFaculty : filteredFaculty.slice(startIndex, endIndex);

  return (
    <div style={{ marginTop: 24, background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-color)", padding: isMobile ? "16px 14px" : "24px 24px", boxShadow: "var(--card-shadow)" }}>
      {/* Section Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18, flexWrap: isMobile ? "wrap" : "nowrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 24 }}>🏛</span>
            <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 19, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              Department-Wise Research & Faculty Directory
            </h3>
            {filterYear !== "All" && (
              <span style={{ background: "rgba(37,99,235,0.1)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)30", padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                Academic Year: {filterYear}
              </span>
            )}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
            Explore department research publications and click on any faculty to inspect their complete profile and all filled submissions.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <span style={{ background: "var(--bg-surface-secondary)", border: "1px solid var(--border-color)", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
            👥 {filteredFaculty.length} Faculty Member{filteredFaculty.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Department Selector Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
        {allDepts.map(function (d) {
          const isA = selectedDept === d;
          return (
            <button
              key={d}
              onClick={function () { setSelectedDept(d); }}
              className="btn-interactive"
              style={{
                padding: "7px 14px",
                borderRadius: 99,
                border: isA ? "1.5px solid var(--accent-primary)" : "1px solid var(--border-color)",
                background: isA ? "var(--accent-gradient)" : "var(--bg-surface-secondary)",
                color: isA ? "#ffffff" : "var(--text-secondary)",
                fontWeight: isA ? 800 : 600,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: isA ? "0 4px 12px rgba(37,99,235,0.25)" : "none"
              }}
            >
              <span>{d === "All" ? "🌐 All Departments" : d}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Department KPI Banner */}
      <div style={{ background: "var(--bg-surface-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(105px, 1fr))", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Faculty</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)" }}>{deptStats.facultyCount}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Total Research</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "var(--accent-primary)" }}>{deptStats.total}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Journals</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#0284c7" }}>{deptStats.modCounts.journals || 0}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Conferences</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#059669" }}>{deptStats.modCounts.conferences || 0}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>FDP / STTP</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#ea580c" }}>{deptStats.modCounts.fdp || 0}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Patents</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#7c3aed" }}>{deptStats.modCounts.patents || 0}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Chapters</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#d97706" }}>{deptStats.modCounts.bookchapters || 0}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Books</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#0891b2" }}>{deptStats.modCounts.books || 0}</span>
        </div>
      </div>

      {/* Filter, Search & Layout Controls Bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        {/* Search input */}
        <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "1", minWidth: isMobile ? 0 : 260 }}>
          <input
            value={search}
            onChange={function (e) { setSearch(e.target.value); }}
            placeholder={`🔍 Search faculty in ${selectedDept === "All" ? "all departments" : selectedDept}...`}
            style={Object.assign({}, INPUT, { padding: "9px 12px 9px 34px", borderRadius: 10 })}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", fontSize: 13 }}>🔍</span>
          {search && (
            <button onClick={function () { setSearch(""); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>✕</button>
          )}
        </div>

        {/* Right Controls: Sort, Active Filter, View Mode, Page Size */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flex: isMobile ? "1 1 100%" : "none" }}>
          <select
            value={sortBy}
            onChange={function (e) { setSortBy(e.target.value); }}
            style={Object.assign({}, INPUT, { width: "auto", padding: "8px 12px", borderRadius: 10, fontSize: 12 })}
          >
            <option value="pubs">Sort: Most Research Output</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>

          <button
            onClick={function () { setOnlyActive(!onlyActive); }}
            className="btn-interactive"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: onlyActive ? "1.5px solid var(--accent-primary)" : "1px solid var(--border-color)",
              background: onlyActive ? "rgba(37,99,235,0.12)" : "var(--bg-surface-secondary)",
              color: onlyActive ? "var(--accent-primary)" : "var(--text-secondary)",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {onlyActive ? "✓ Active Only" : "Active (>0)"}
          </button>

          {/* View Mode Switcher: Cards ⊞ vs Table ☰ */}
          <div style={{ display: "flex", borderRadius: 10, border: "1px solid var(--border-color)", overflow: "hidden", background: "var(--bg-surface-secondary)" }}>
            <button
              onClick={function () { setViewMode("grid"); }}
              title="Card Grid View"
              className="btn-interactive"
              style={{
                padding: "7px 11px",
                border: "none",
                background: viewMode === "grid" ? "var(--accent-primary)" : "transparent",
                color: viewMode === "grid" ? "#fff" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>⊞</span> {!isMobile && "Cards"}
            </button>
            <button
              onClick={function () { setViewMode("table"); }}
              title="Compact Scannable Table View"
              className="btn-interactive"
              style={{
                padding: "7px 11px",
                border: "none",
                background: viewMode === "table" ? "var(--accent-primary)" : "transparent",
                color: viewMode === "table" ? "#fff" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>☰</span> {!isMobile && "Table"}
            </button>
          </div>

          {/* Page Size Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-surface-secondary)", padding: "2px 8px", borderRadius: 10, border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Show:</span>
            <select
              value={pageSize}
              onChange={function (e) { setPageSize(e.target.value === "all" ? "all" : Number(e.target.value)); }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-primary)",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Faculty Directory Body */}
      {filteredFaculty.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>👥</div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>No faculty members found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try changing your department selection, search query, or active filter.</div>
        </div>
      ) : viewMode === "table" ? (
        /* COMPACT TABLE VIEW */
        <div style={{ overflowX: "auto", background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--table-th-bg)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={TH}>#</th>
                <th style={TH}>Faculty Name & Designation</th>
                <th style={TH}>Dept</th>
                <th style={TH}>Faculty ID</th>
                <th style={TH} title="Journal Papers">📄 J</th>
                <th style={TH} title="Conferences">🎤 C</th>
                <th style={TH} title="FDP / STTP">🎓 F</th>
                <th style={TH} title="Patents / IPR">🏛 P</th>
                <th style={TH} title="Book Chapters">📑 Ch</th>
                <th style={TH} title="Books">📚 B</th>
                <th style={TH} title="Total Submissions">⭐ Total</th>
                <th style={Object.assign({}, TH, { textAlign: "right" })}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFaculty.map(function (fac, idx) {
                const stats = userStatsMap[fac.id] || { journals: 0, conferences: 0, fdp: 0, patents: 0, bookchapters: 0, books: 0, total: 0 };
                const f = fac.faculty || {};
                const desig = f.presentDesig || (fac.role === "admin" ? "Administrator" : "Faculty Member");
                const rowNum = startIndex + idx + 1;

                return (
                  <tr
                    key={fac.id}
                    className="row-hover"
                    onClick={function () { onSelectFaculty(fac); }}
                    style={{ cursor: "pointer", borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <td style={Object.assign({}, TD, { color: "var(--text-muted)", fontWeight: 700, fontSize: 12 })}>{rowNum}</td>
                    <td style={TD}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                          {fac.name ? fac.name[0].toUpperCase() : "F"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13 }}>
                            {f.title ? f.title + " " : ""}{fac.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{desig} • {fac.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{ background: "rgba(37,99,235,0.1)", color: "var(--accent-primary)", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {fac.dept}
                      </span>
                    </td>
                    <td style={TD}>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 12 }}>
                        {fac.facultyId || "—"}
                      </span>
                    </td>
                    <td style={TD}><b style={{ color: stats.journals > 0 ? "#0284c7" : "var(--text-muted)" }}>{stats.journals}</b></td>
                    <td style={TD}><b style={{ color: stats.conferences > 0 ? "#059669" : "var(--text-muted)" }}>{stats.conferences}</b></td>
                    <td style={TD}><b style={{ color: stats.fdp > 0 ? "#ea580c" : "var(--text-muted)" }}>{stats.fdp}</b></td>
                    <td style={TD}><b style={{ color: stats.patents > 0 ? "#7c3aed" : "var(--text-muted)" }}>{stats.patents}</b></td>
                    <td style={TD}><b style={{ color: stats.bookchapters > 0 ? "#d97706" : "var(--text-muted)" }}>{stats.bookchapters}</b></td>
                    <td style={TD}><b style={{ color: stats.books > 0 ? "#0891b2" : "var(--text-muted)" }}>{stats.books}</b></td>
                    <td style={TD}>
                      <span style={{ fontWeight: 900, color: stats.total > 0 ? "var(--accent-primary)" : "var(--text-muted)", fontSize: 14 }}>
                        {stats.total}
                      </span>
                    </td>
                    <td style={Object.assign({}, TD, { textAlign: "right" })}>
                      <button
                        onClick={function (e) { e.stopPropagation(); onSelectFaculty(fac); }}
                        className="btn-interactive"
                        style={{
                          padding: "5px 12px",
                          background: "var(--accent-primary)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 11,
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
          {paginatedFaculty.map(function (fac) {
            const stats = userStatsMap[fac.id] || { journals: 0, conferences: 0, fdp: 0, patents: 0, bookchapters: 0, books: 0, total: 0 };
            const f = fac.faculty || {};
            const desig = f.presentDesig || (fac.role === "admin" ? "Administrator" : "Faculty Member");

            return (
              <div
                key={fac.id}
                onClick={function () { onSelectFaculty(fac); }}
                className="hover-lift"
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: 14,
                  border: "1px solid var(--border-color)",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s"
                }}
              >
                {/* Faculty Top Info */}
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 18, flexShrink: 0, boxShadow: "0 2px 8px rgba(37,99,235,0.2)" }}>
                      {fac.name ? fac.name[0].toUpperCase() : "F"}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.title ? f.title + " " : ""}{fac.name}
                        </div>
                        <span style={{ background: "rgba(37,99,235,0.1)", color: "var(--accent-primary)", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          {fac.dept}
                        </span>
                        {fac.facultyId && (
                          <span style={{ background: "var(--bg-surface-secondary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                            {fac.facultyId}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, fontWeight: 600 }}>
                        {desig}
                      </div>

                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        ✉ {fac.email}
                      </div>
                    </div>
                  </div>

                  {/* Badges Grid for Research Counts */}
                  <div style={{ background: "var(--bg-surface-secondary)", borderRadius: 10, padding: "10px 12px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                      <span>📄</span>
                      <span style={{ color: "var(--text-muted)" }}>Journals:</span>
                      <b style={{ color: "#0284c7" }}>{stats.journals}</b>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                      <span>🎤</span>
                      <span style={{ color: "var(--text-muted)" }}>Conf:</span>
                      <b style={{ color: "#059669" }}>{stats.conferences}</b>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                      <span>🎓</span>
                      <span style={{ color: "var(--text-muted)" }}>FDP:</span>
                      <b style={{ color: "#ea580c" }}>{stats.fdp}</b>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                      <span>🏛</span>
                      <span style={{ color: "var(--text-muted)" }}>Patents:</span>
                      <b style={{ color: "#7c3aed" }}>{stats.patents}</b>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                      <span>📑</span>
                      <span style={{ color: "var(--text-muted)" }}>Chapters:</span>
                      <b style={{ color: "#d97706" }}>{stats.bookchapters}</b>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                      <span>📚</span>
                      <span style={{ color: "var(--text-muted)" }}>Books:</span>
                      <b style={{ color: "#0891b2" }}>{stats.books}</b>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                    Total: <span style={{ color: stats.total > 0 ? "var(--accent-primary)" : "var(--text-muted)", fontSize: 14, fontWeight: 900 }}>{stats.total}</span> records
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--accent-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    Complete Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer Bar */}
      {filteredFaculty.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border-color)", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
            Showing <b style={{ color: "var(--text-primary)" }}>{filteredFaculty.length === 0 ? 0 : startIndex + 1}–{endIndex}</b> of <b style={{ color: "var(--text-primary)" }}>{filteredFaculty.length}</b> faculties
          </div>

          {pageSize !== "all" && totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={function () { setCurrentPage(function (p) { return Math.max(1, p - 1); }); }}
                disabled={safeCurrentPage <= 1}
                className="btn-interactive"
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-surface-secondary)",
                  color: safeCurrentPage <= 1 ? "var(--text-muted)" : "var(--text-primary)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: safeCurrentPage <= 1 ? "not-allowed" : "pointer",
                  opacity: safeCurrentPage <= 1 ? 0.6 : 1
                }}
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, function (_, i) { return i + 1; })
                .filter(function (p) {
                  return p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1;
                })
                .map(function (p, idx, arr) {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <span key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {showEllipsis && <span style={{ color: "var(--text-muted)", fontSize: 12 }}>…</span>}
                      <button
                        onClick={function () { setCurrentPage(p); }}
                        className="btn-interactive"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: p === safeCurrentPage ? "1.5px solid var(--accent-primary)" : "1px solid var(--border-color)",
                          background: p === safeCurrentPage ? "var(--accent-primary)" : "var(--bg-surface-secondary)",
                          color: p === safeCurrentPage ? "#ffffff" : "var(--text-primary)",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}

              <button
                onClick={function () { setCurrentPage(function (p) { return Math.min(totalPages, p + 1); }); }}
                disabled={safeCurrentPage >= totalPages}
                className="btn-interactive"
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-surface-secondary)",
                  color: safeCurrentPage >= totalPages ? "var(--text-muted)" : "var(--text-primary)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: safeCurrentPage >= totalPages ? "not-allowed" : "pointer",
                  opacity: safeCurrentPage >= totalPages ? 0.6 : 1
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ── Profile Components ────────────────────────────────────────────────────────
const ProfileField = function ({ label, name, type = "text", span = 1, options, form, handleChange, setForm, isMobile, required = false, disabled = false, placeholder = "" }) {
  return (
    <div style={{ gridColumn: (isMobile || span !== 2) ? "span 1" : ("span " + span) }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4, display: "block" }}>
        {label} {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {type === "select" ? (
        <select name={name} value={form[name] || ""} onChange={handleChange} disabled={disabled} style={Object.assign({}, INPUT, disabled ? { background: "#f8fafc", cursor: "not-allowed" } : {})}>
          <option value="">Select...</option>
          {options.map(function (o) { return <option key={o} value={o}>{o}</option>; })}
        </select>
      ) : type === "date" ? (
        <input type="date" name={name} value={form[name] ? form[name].split('T')[0] : ""} onChange={handleChange} disabled={disabled} style={Object.assign({}, INPUT, disabled ? { background: "#f8fafc", cursor: "not-allowed" } : {})} />
      ) : type === "checkbox" ? (
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" name={name} checked={!!form[name]} disabled={disabled} onChange={function (e) {
            const next = Object.assign({}, form);
            next[name] = e.target.checked;
            setForm(next);
          }} /> Yes
        </label>
      ) : (
        <input
          type={type}
          name={name}
          value={form[name] || ""}
          placeholder={placeholder}
          disabled={disabled}
          onChange={function (e) {
            if (name === "panNo") {
              const val = e.target.value.toUpperCase();
              setForm(Object.assign({}, form, { panNo: val }));
            } else {
              handleChange(e);
            }
          }}
          style={Object.assign({}, INPUT, disabled ? { background: "#f8fafc", cursor: "not-allowed" } : {})}
        />
      )}
    </div>
  );
};

const ProfileSection = function ({ title, isMobile }) {
  return <div style={{ gridColumn: isMobile ? "span 1" : "span 2", fontSize: 15, fontWeight: 800, color: "#0f2942", borderBottom: "1px solid #e2e8f0", paddingBottom: 6, marginTop: 16 }}>{title}</div>;
};

// ── Main App ──────────────────────────────────────────────────────────────────
function ProfileView({ user, showToast, isMobile }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(function () {
    async function loadProfile() {
      try {
        const res = await api.get('/api/profile');
        if (res.profile) {
          setProfile(res.profile);
          setForm(res.profile);
        } else {
          setForm({});
        }
      } catch (err) {
        showToast("Error loading profile", "error");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [showToast]);

  const handleChange = function (e) {
    const next = Object.assign({}, form);
    next[e.target.name] = e.target.value;
    setForm(next);
  };

  const handleSave = async function () {
    // 1. Mandatory Compulsory Fields Check
    const requiredFields = [
      { name: "title", label: "Title" },
      { name: "firstName", label: "First Name" },
      { name: "gender", label: "Gender" },
      { name: "dob", label: "Date of Birth" },
      { name: "category", label: "Category" },
      { name: "highestDegree", label: "Highest degree" },
      { name: "university", label: "University" },
      { name: "specialization", label: "Area of Specialization" },
      { name: "mobile", label: "Mobile No." },
      { name: "email", label: "Personal Email" },
      { name: "panNo", label: "PAN No." },
      { name: "presentDesig", label: "Present Designation" },
      { name: "presentDept", label: "Present Department" },
      { name: "doj", label: "Date of Joining in this Institution" },
      { name: "experienceYearsCurrInst", label: "Experience in years in current institute" },
      { name: "desigAtJoiningInst", label: "Designation at Time Joining in this Institution" },
      { name: "natureOfAssociation", label: "Nature of Association" },
      { name: "currentlyAssociated", label: "Currently Associated (Y/N)" },
    ];

    for (const f of requiredFields) {
      if (!form[f.name] || form[f.name].toString().trim() === "") {
        showToast(`Compulsory Field Missing: ${f.label}`, "error");
        return;
      }
    }

    // Conditional Mandatory Field Check
    if (form.natureOfAssociation === "Contract" && (!form.contractType || form.contractType === "N/A" || form.contractType.trim() === "")) {
      showToast("Compulsory Field Missing: Contractual Type (Full time / Part time / Hourly based)", "error");
      return;
    }

    if (form.currentlyAssociated === "N" && (!form.dateOfLeaving || form.dateOfLeaving.trim() === "")) {
      showToast("Compulsory Field Missing: Date of Leaving (since Currently Associated is 'N')", "error");
      return;
    }

    // 2. Specific Format Constraints Validation
    // PAN No. validation (e.g. ABCDE1234F)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test((form.panNo || "").trim())) {
      showToast("Invalid PAN No. format (e.g. ABCDE1234F)", "error");
      return;
    }

    // Mobile No. validation (10 digits)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test((form.mobile || "").trim())) {
      showToast("Invalid Mobile No. (Must be 10 digits starting with 6-9)", "error");
      return;
    }

    // Personal Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test((form.email || "").trim())) {
      showToast("Invalid Personal Email address format", "error");
      return;
    }

    // Aadhaar No. validation (if entered)
    if (form.aadhaarNo && form.aadhaarNo.trim() !== "") {
      const aadhaarRegex = /^\d{12}$/;
      if (!aadhaarRegex.test(form.aadhaarNo.trim())) {
        showToast("Invalid Aadhaar No. (Must be exactly 12 digits)", "error");
        return;
      }
    }

    // Experience in years validation
    const expNum = parseFloat(form.experienceYearsCurrInst);
    if (isNaN(expNum) || expNum < 0) {
      showToast("Experience in years must be a valid non-negative number", "error");
      return;
    }

    // Date validations
    const now = new Date();
    const dob = new Date(form.dob);
    const doj = new Date(form.doj);

    if (dob >= now) {
      showToast("Date of Birth must be a past date", "error");
      return;
    }

    const age = (now - dob) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) {
      showToast("Faculty age must be at least 18 years", "error");
      return;
    }

    if (doj > now) {
      showToast("Date of Joining cannot be a future date", "error");
      return;
    }

    if (doj <= dob) {
      showToast("Date of Joining must be after Date of Birth", "error");
      return;
    }

    if (form.dateDesignatedProfAssocProf && form.dateDesignatedProfAssocProf.trim() !== "") {
      const dateProf = new Date(form.dateDesignatedProfAssocProf);
      if (dateProf < doj) {
        showToast("Date Designated as Professor/Associate Professor cannot be before Date of Joining", "error");
        return;
      }
    }

    if (form.currentlyAssociated === "N" && form.dateOfLeaving) {
      const dateLeaving = new Date(form.dateOfLeaving);
      if (dateLeaving < doj) {
        showToast("Date of Leaving cannot be before Date of Joining", "error");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await api.put('/api/profile', form);
      setProfile(res.profile);
      showToast("Profile updated successfully", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading profile...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff", borderRadius: 14, padding: isMobile ? "16px 14px" : "24px 32px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, borderBottom: "1px solid #f1f5f9", paddingBottom: 20, flexWrap: isMobile ? "wrap" : "nowrap" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#0f2942,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 24, flexShrink: 0 }}>
          {user.name ? user.name[0].toUpperCase() : "U"}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, color: "#0f2942", fontSize: isMobile ? 20 : 24, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</h2>
          <div style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>{user.email} • <Badge text={user.role} /></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "12px 14px" : "16px 20px" }}>

        <ProfileSection title="Basic Details" isMobile={isMobile} />
        <ProfileField name="title" label="Title" type="select" options={["Mr", "Ms", "Dr", "Prof"]} required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="firstName" label="First Name" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="middleName" label="Middle Name" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="lastName" label="Last Name" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="gender" label="Gender" type="select" options={["Male", "Female", "Transgender"]} required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="dob" label="Date of Birth" type="date" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="placeOfBirth" label="Place of Birth" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="category" label="Category" type="select" options={["GEN", "SC", "ST", "OBC", "EWS", "PH"]} required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="bloodGroup" label="Blood Group" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />

        <ProfileSection title="Academic Qualification" isMobile={isMobile} />
        <ProfileField name="highestDegree" label="Highest degree" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="university" label="University" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="specialization" label="Area of Specialization" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />

        <ProfileSection title="Contact & Identity" isMobile={isMobile} />
        <ProfileField name="mobile" label="Mobile No." required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} placeholder="10-digit mobile number" />
        <ProfileField name="email" label="Personal Email" type="email" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} placeholder="name@example.com" />
        <ProfileField name="nationality" label="Nationality" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="aadhaarNo" label="Aadhaar No." form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} placeholder="12-digit Aadhaar number" />
        <ProfileField name="panNo" label="PAN No." required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} placeholder="ABCDE1234F" />
        <ProfileField name="apaarFacultyId" label="APAAR faculty ID*(if any)" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />

        <ProfileSection title="Institutional Employment & Association" isMobile={isMobile} />
        <ProfileField name="presentDesig" label="Present Designation" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="presentDept" label="Present Department" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="doj" label="Date of Joining in this Institution" type="date" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="experienceYearsCurrInst" label="Experience in years in current institute" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} placeholder="e.g. 5" />
        <ProfileField name="desigAtJoiningInst" label="Designation at Time Joining in this Institution" required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="dateDesignatedProfAssocProf" label="The date on which Designated as Professor/ Associate Professor if any" type="date" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="natureOfAssociation" label="Nature of Association (Regular/ Contract/ Ad hoc)" type="select" options={["Regular", "Contract", "Ad hoc"]} required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="contractType" label="If contractual mention Full time or (Part time or hourly based)" type="select" options={["N/A", "Full time", "Part time", "Hourly based"]} required={form.natureOfAssociation === "Contract"} form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="currentlyAssociated" label="Currently Associated (Y/N)" type="select" options={["Y", "N"]} required form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="dateOfLeaving" label="Date of Leaving if any (In case Currently Associated is “No”)" type="date" required={form.currentlyAssociated === "N"} disabled={form.currentlyAssociated !== "N"} form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="dor" label="Date of Relieving (DOR)" type="date" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />

        <ProfileSection title="Family Details" isMobile={isMobile} />
        <ProfileField name="fatherName" label="Father's Name" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="motherName" label="Mother's Name" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="spouseName" label="Spouse's Name" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />

        <ProfileSection title="Other Information" isMobile={isMobile} />
        <ProfileField name="isOldFaculty" label="Is Old Faculty?" type="checkbox" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="oldFacultyId" label="Old Faculty ID (if applicable)" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="isFyCommonFaculty" label="Is FY Common Faculty?" type="checkbox" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />
        <ProfileField name="fyCommonSubject" label="FY Common Subject" form={form} handleChange={handleChange} setForm={setForm} isMobile={isMobile} />

        <div style={{ gridColumn: isMobile ? "span 1" : "span 2", marginTop: 10, display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: "12px 24px", background: "#0f2942", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer", flex: 1, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
          <button onClick={function () { printResume(user, form); }} style={{ padding: "12px 24px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer", flex: 1 }}>
            🖨 Print Resume
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const emptyData = { journals: [], patents: [], conferences: [], fdp: [], bookchapters: [], books: [] };
  const [user, setUser] = useState(null);
  const [data, setData] = useState(emptyData);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [active, setActive] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [selectedFacultyModal, setSelectedFacultyModal] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [touchStartX, setTouchStartX] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [loginErr, setLoginErr] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [demoUsers, setDemoUsers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [theme, setTheme] = useState("classic");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("All");

  // Sync Theme
  useEffect(function () {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('erp_theme') : null;
    if (saved && THEMES.some(function (t) { return t.id === saved; })) {
      setTheme(saved);
    }
  }, []);

  useEffect(function () {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('erp_theme', theme);
    }
  }, [theme]);

  // Global Ctrl + K search shortcut
  useEffect(function () {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchEl = document.getElementById("erp-search-input");
        if (searchEl) searchEl.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return function () { window.removeEventListener("keydown", handleKeyDown); };
  }, []);

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  const FIELD_CONFIGS = getFieldConfigs(departments);

  const showToast = useCallback(function (msg, type) {
    setToast({ msg, type: type || "success" });
    setTimeout(function () { setToast(null); }, 3500);
  }, []);

  const loadAll = useCallback(async function (currentUser) {
    setLoading(true);
    try {
      const moduleResults = await Promise.all(MODULES.map(function (m) { return api.get('/api/' + m).catch(function () { return []; }); }));
      const newData = {};
      MODULES.forEach(function (m, i) { newData[m] = moduleResults[i]; });
      setData(newData);
      if (currentUser && currentUser.role === 'admin') {
        const [usersData, deptsData] = await Promise.all([
          api.get('/api/users').catch(function () { return []; }),
          api.get('/api/departments').catch(function () { return []; }),
        ]);
        setUsers(usersData);
        setDepartments(deptsData);
      } else {
        const deptsData = await api.get('/api/departments').catch(function () { return []; });
        setDepartments(deptsData);
      }
    } catch (e) { showToast("Failed to load data", "error"); }
    setLoading(false);
  }, [showToast]);

  // Check auth on mount
  useEffect(function () {
    api.get('/api/auth?action=me')
      .then(function (u) { setUser(u); return loadAll(u); })
      .catch(function () { setLoading(false); });
  }, []);

  // Load demo users
  useEffect(function () {
    api.get('/api/auth?action=demo-users')
      .then(setDemoUsers)
      .catch(function () { /* ignore */ });
  }, []);

  // Keep professional credential list in sync with typed login email
  useEffect(function () {
    const email = loginForm.email.trim();
    if (!email) return;
    if (!email.endsWith('@bpitindia.edu.in')) return;
    const already = demoUsers.some(function (u) { return u.email.toLowerCase() === email.toLowerCase(); });
    if (already) return;
    const existingUser = users.find(function (u) { return u.email.toLowerCase() === email.toLowerCase(); });
    const role = existingUser ? existingUser.role : 'Faculty';
    const name = existingUser ? existingUser.name : email.split('@')[0];
    setDemoUsers(function (prev) {
      if (prev.some(function (u) { return u.email.toLowerCase() === email.toLowerCase(); })) return prev;
      return [...prev, { id: existingUser ? existingUser.id : Date.now(), name, email, role, dept: existingUser ? existingUser.dept : 'CSE' }];
    });
  }, [loginForm.email, demoUsers, users]);

  // Responsive layout helper
  useEffect(function () {
    function update() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    }
    update();
    window.addEventListener("resize", update);
    return function () { window.removeEventListener("resize", update); };
  }, []);

  // Auto-fill department, academicYear, and year for faculty/admin members when opening form
  useEffect(function () {
    if (showForm && !editRecord) {
      setForm(function (prev) {
        const next = Object.assign({}, prev);
        if (user && user.dept && user.dept !== "Administration" && !next.department) {
          next.department = user.dept;
        }
        if (!next.academicYear) {
          next.academicYear = getCurrentAcademicYear();
        }
        if (!next.year) {
          next.year = new Date().getFullYear().toString();
        }
        return next;
      });
    }
  }, [showForm, editRecord, user]);

  async function handleLogin() {
    setLoggingIn(true);
    setLoginErr("");
    try {
      const u = await api.post('/api/auth?action=login', loginForm);
      if (u.token) localStorage.setItem('erp_token', u.token);
      setUser(u);
      await loadAll(u);
      setDemoUsers(function (prev) {
        if (prev.some(function (x) { return x.email === u.email; })) return prev;
        return [...prev, { id: u.id, name: u.name, email: u.email, role: u.role, dept: u.dept }];
      });
    } catch (e) {
      setLoginErr("Invalid email or password");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await api.post('/api/auth?action=logout', {}).catch(function () { });
    localStorage.removeItem('erp_token');
    setUser(null);
    setData(emptyData);
    setUsers([]);
    setActive("dashboard");
  }

  async function handleForgotPassword() {
    if (!forgotEmail) { setForgotMsg("Email required"); return; }
    setForgotMsg("");
    try {
      const res = await api.post('/api/auth?action=forgot-password', { email: forgotEmail });
      setForgotMsg(res.message);
    } catch (e) {
      setForgotMsg(e.message);
    }
  }

  async function handleSubmit() {
    const cfg = FIELD_CONFIGS[active];
    if (!cfg) return;
    for (let i = 0; i < cfg.fields.length; i++) {
      const f = cfg.fields[i];
      const val = form[f.name];
      const isEmpty = val === undefined || val === null || val === '';
      if (f.required && isEmpty) { showToast('"' + f.label + '" is required', "error"); return; }
    }
    if (active === "journals") {
      const month = Number(form.publicationMonth);
      if (Number.isNaN(month) || month < 1 || month > 12) { showToast('"Month of the Publication" must be between 1 and 12', "error"); return; }
      const totalAuthors = Number(form.totalAuthors);
      if (!Number.isInteger(totalAuthors) || totalAuthors < 1) { showToast('"Total Number of Authors" must be at least 1', "error"); return; }
      const authorPosition = Number(form.authorPosition);
      if (!Number.isInteger(authorPosition) || authorPosition < 1) { showToast('"Position of Your Name in Authors List" must be at least 1', "error"); return; }
      if (form.pages) {
        const pagesPattern = /^[0-9]+-[0-9]+$/;
        if (!pagesPattern.test(form.pages.trim())) { showToast('"Page No(s)" must be in range format like 5-9', "error"); return; }
      }
      const doiValue = (form.doi || "").trim();
      if (doiValue && (!doiValue.startsWith("https://doi.org/") || doiValue.length <= "https://doi.org/".length)) {
        showToast('"DOI Number" must use the format https://doi.org/<prefix>/<suffix>', "error"); return;
      }
    }
    try {
      const validFields = new Set(cfg.fields.map(function (f) { return f.name; }));
      const payload = Object.fromEntries(Object.entries(form).filter(function (entry) {
        const key = entry[0];
        return validFields.has(key) || key === 'id';
      }));
      console.log('[DEBUG] active:', active, 'payload keys:', Object.keys(payload));
      if (editRecord) {
        const updated = await api.put('/api/' + active, payload);
        setData(function (p) { const nx = Object.assign({}, p); nx[active] = p[active].map(function (r) { return r.id === editRecord.id ? updated : r; }); return nx; });
        showToast("Record updated");
      } else {
        const created = await api.post('/api/' + active, payload);
        setData(function (p) { const nx = Object.assign({}, p); nx[active] = [created, ...(p[active] || [])]; return nx; });
        showToast("Record added");
      }
      setForm({}); setShowForm(false); setEditRecord(null);
    } catch (e) { showToast(e.message || 'Failed to save record', "error"); }
  }

  async function handleDelete(id) {
    try {
      await api.del('/api/' + active + '?id=' + id);
      setData(function (p) { const nx = Object.assign({}, p); nx[active] = p[active].filter(function (r) { return r.id !== id; }); return nx; });
      showToast("Record deleted");
      setConfirmDelete(null);
    } catch (e) { showToast(e.message, "error"); }
  }

  function handleEdit(record) {
    setForm(Object.assign({}, record)); setEditRecord(record); setShowForm(true);
  }

  function canEdit(record) {
    return user && (user.role === "admin" || record.submittedById === user.id);
  }

  const filtered = (active !== "dashboard" && active !== "users" && active !== "branches" && active !== "reports" && FIELD_CONFIGS[active]) ?
    (data[active] || []).filter(function (r) {
      const ms = Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase());
      let recDept = r.department;
      if (!recDept) {
        const submitter = (users || []).find(function (u) { return u.id === r.submittedById; });
        if (submitter) recDept = submitter.dept;
      }
      const md = filterDept === "All" || recDept === filterDept;
      const my = filterYear === "All" || r.academicYear === filterYear;
      const st = statusFilter === "All" || r.status === statusFilter;
      return ms && md && my && st;
    }).sort(function (a, b) {
      if (!sortField) return 0;
      const valA = (a[sortField] || "").toString().toLowerCase();
      const valB = (b[sortField] || "").toString().toLowerCase();
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    }) : [];

  // Dashboard stats
  const allRecs = Object.entries(data).flatMap(function (entry) {
    return (entry[1] || []).filter(function (r) { return filterYear === "All" || r.academicYear === filterYear; }).map(function (r) { return Object.assign({}, r, { _mod: entry[0] }); });
  });
  const byMod = {};
  Object.keys(FIELD_CONFIGS).forEach(function (k) { byMod[k] = (allRecs.filter(function (r) { return r._mod === k; })).length; });
  const byDept = {};
  allRecs.forEach(function (r) {
    const submitter = (users || []).find(function (u) { return u.id === r.submittedById; });
    let dept = (submitter && submitter.dept) ? submitter.dept : r.department;
    if (dept) {
      const displayDept = dept === "Administration" ? "Principal" : dept;
      byDept[displayDept] = (byDept[displayDept] || 0) + 1;
    }
  });
  const byYear = {};
  allRecs.forEach(function (r) { if (r.academicYear) byYear[r.academicYear] = (byYear[r.academicYear] || 0) + 1; });
  const totalRecs = allRecs.length;
  const PIE_COLORS = ["#0284c7", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"];
  const pieData = Object.entries(byMod).filter(function (e) { return e[1] > 0; }).map(function (e) { return { name: FIELD_CONFIGS[e[0]] ? FIELD_CONFIGS[e[0]].title : e[0], value: e[1] }; });
  const barData = Object.entries(byDept).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8).map(function (e) { return { dept: e[0], count: e[1] }; });
  const yearData = ACADEMIC_YEARS.map(function (y) { return { year: y, count: byYear[y] || 0 }; });
  const visibleModules = MODULE_CONFIG.filter(function (m) { return !m.adminOnly || (user && user.role === "admin"); });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f0f4f8" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⟳</div>
        <div style={{ fontWeight: 700, color: "#1e3a5f" }}>Loading ERP...</div>
      </div>
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, var(--bg-app) 0%, var(--bg-surface-secondary) 50%, var(--bg-app) 100%)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <Head><title>BPIT ScholarPulse - Login</title></Head>

      {/* Floating Animated Background Orbs */}
      <div className="login-bg-orb-1" />
      <div className="login-bg-orb-2" />

      {/* Top Header Bar for Login Page */}
      <header style={{ background: "var(--bg-header)", padding: isMobile ? "12px 16px" : "14px 32px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        {/* Left Margin: BPIT Logo & Institute Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/logo.png" alt="BPIT Logo" style={{ height: isMobile ? 36 : 44, width: "auto", objectFit: "contain" }} title="BPIT" />
          {!isMobile && (
            <div>
              <div style={{ color: "var(--text-primary)", fontWeight: 900, fontSize: 15, letterSpacing: "-0.01em" }}>Bhagwan Parshuram Institute of Technology</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600 }}>Approved by AICTE & Affiliated to GGSIPU</div>
            </div>
          )}
        </div>

        {/* Right Margin: Theme Selector & SDC Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 14 }}>
          <select
            value={theme}
            onChange={function (e) { setTheme(e.target.value); }}
            className="btn-interactive"
            style={{
              padding: isMobile ? "5px 8px" : "7px 14px",
              border: "1.5px solid var(--border-color)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text-primary)",
              background: "var(--bg-surface-secondary)",
              fontWeight: 700,
              outline: "none",
              cursor: "pointer"
            }}
            title="Choose ERP Theme"
          >
            {THEMES.map(function (t) {
              return <option key={t.id} value={t.id}>{t.icon} {t.label}</option>;
            })}
          </select>

          <div style={{ display: "flex", alignItems: "center", paddingLeft: isMobile ? 6 : 12, borderLeft: "1px solid var(--border-color)", height: 38 }}>
            <img src="/sdc-logo.jpeg" alt="SDC Logo" style={{ height: isMobile ? 30 : 40, width: "auto", borderRadius: 6, objectFit: "contain" }} title="Software Development Cell (SDC)" />
          </div>
        </div>
      </header>

      {/* Main Centered Login Section */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "20px 14px" : "36px 20px", position: "relative", zIndex: 5 }}>
        <div className="modal-animate hover-lift" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 24, padding: isMobile ? "24px 18px" : "36px 32px", width: "min(440px, 94vw)", boxShadow: "0 20px 50px rgba(0,0,0,0.1)" }}>
          {/* Center Icon Badge & Large Main Focus Heading */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--accent-gradient)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 10px 25px rgba(37,99,235,0.35)", marginBottom: 12 }}>
              🎓
            </div>
            <h1 style={{ color: "var(--text-primary)", fontSize: isMobile ? 26 : 32, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.03em" }}>
              ScholarPulse
            </h1>
            <p style={{ color: "var(--accent-primary)", fontSize: 13, fontWeight: 700, margin: "0 0 16px" }}>
              Bhagwan Parshuram Institute of Technology
            </p>

            <div style={{ borderBottom: "1px solid var(--border-color)", margin: "16px 0 20px" }} />

            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-secondary)", marginBottom: 4 }}>
              Sign In
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, margin: 0 }}>
              Login using your institutional email credentials
            </p>
          </div>

          {/* Form Inputs */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--text-muted)", pointerEvents: "none" }}>📄</span>
              <input
                type="email"
                value={loginForm.email}
                onChange={function (e) { setLoginForm(function (p) { return Object.assign({}, p, { email: e.target.value }); }); }}
                placeholder="your@bpitindia.edu.in"
                onKeyDown={function (e) { if (e.key === "Enter") handleLogin(); }}
                autoFocus
                style={Object.assign({}, INPUT, { padding: "12px 14px 12px 42px", borderRadius: 12, fontSize: 14, background: "var(--bg-surface-secondary)", border: "1.5px solid var(--border-color)" })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--text-muted)", pointerEvents: "none" }}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={function (e) { setLoginForm(function (p) { return Object.assign({}, p, { password: e.target.value }); }); }}
                placeholder="••••••••"
                onKeyDown={function (e) { if (e.key === "Enter") handleLogin(); }}
                style={Object.assign({}, INPUT, { padding: "12px 44px 12px 42px", borderRadius: 12, fontSize: 14, background: "var(--bg-surface-secondary)", border: "1.5px solid var(--border-color)" })}
              />
              <button
                type="button"
                onClick={function () { setShowPassword(!showPassword); }}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-muted)", padding: 4 }}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={rememberMe} onChange={function (e) { setRememberMe(e.target.checked); }} style={{ width: 16, height: 16, accentColor: "var(--accent-primary)", borderRadius: 4, cursor: "pointer" }} />
              Remember Me
            </label>
            <a href="#" onClick={function (e) { e.preventDefault(); setShowForgot(true); }} style={{ color: "var(--accent-primary)", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Forgot Password?
            </a>
          </div>

          {loginErr && (
            <div className="toast-animate" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 18, fontWeight: 600 }}>
              ⚠ {loginErr}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="btn-interactive"
            style={{ width: "100%", padding: "13px", background: "var(--accent-gradient)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: loggingIn ? "wait" : "pointer", boxShadow: "0 8px 20px rgba(37,99,235,0.25)", opacity: loggingIn ? 0.8 : 1 }}
          >
            {loggingIn ? "Authenticating... ⟳" : "Login"}
          </button>

          {/* Quick Credentials */}
          <div style={{ marginTop: isMobile ? 16 : 24, padding: isMobile ? "10px 12px" : "14px 16px", background: "var(--bg-surface-secondary)", borderRadius: 14, border: "1px solid var(--border-color)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: isMobile ? 10 : 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span>Quick Credentials</span>
              <span style={{ color: "var(--accent-primary)", fontSize: isMobile ? 10 : 11, fontWeight: 800 }}>Click to fill ⚡</span>
            </div>
            <div style={{ maxHeight: isMobile ? 130 : 180, overflowY: "auto", paddingRight: 2 }}>
              {(() => {
                const credentialUsers = demoUsers.filter(function (u) {
                  return u.role && (u.role.toLowerCase() === "faculty" || u.role.toLowerCase() === "admin");
                }).slice(0, 6);

                if (!credentialUsers.length) {
                  return <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No credentials available</div>;
                }

                return credentialUsers.map(function (userItem) {
                  return (
                    <div
                      key={userItem.email}
                      className="btn-interactive"
                      onClick={function () { setLoginForm({ email: userItem.email, password: "" }); showToast(`Auto-filled: ${userItem.email}`); }}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", gap: 8, minWidth: 0 }}
                    >
                      <span style={{ color: "var(--text-secondary)", fontSize: isMobile ? 11 : 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }} title={userItem.email}>
                        {userItem.email}
                      </span>
                      <Badge text={userItem.role || "Faculty"} />
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border-color)", background: "var(--bg-header)", position: "relative", zIndex: 5, fontWeight: 600 }}>
        © {new Date().getFullYear()} Bhagwan Parshuram Institute of Technology • Developed & Maintained by Dr. Aman Dureja, Department of IT, Member-Software Development Cell (SDC)
      </footer>

      {showForgot && (
        <Modal onClose={() => { setShowForgot(false); setForgotEmail(""); setForgotMsg(""); }} isMobile={isMobile}>
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Forgot Password</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Enter your email to receive a password reset link.</div>
            <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="your@bpitindia.edu.in"
              style={Object.assign({}, INPUT, { padding: "12px 16px", borderRadius: 10, fontSize: 14, marginBottom: 12 })} />
            {forgotMsg && <div style={{ background: forgotMsg.includes("error") ? "#fef2f2" : "#f0fdf4", border: "1px solid " + (forgotMsg.includes("error") ? "#fecaca" : "#bbf7d0"), borderRadius: 8, padding: "10px 14px", color: forgotMsg.includes("error") ? "#ef4444" : "#059669", fontSize: 13, marginBottom: 16 }}>{forgotMsg}</div>}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => { setShowForgot(false); setForgotEmail(""); setForgotMsg(""); }} className="btn-interactive" style={{ padding: "10px 24px", background: "var(--bg-surface-secondary)", border: "1px solid var(--border-color)", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "var(--text-primary)" }}>Cancel</button>
              <button onClick={handleForgotPassword} className="btn-interactive" style={{ padding: "10px 28px", background: "var(--accent-gradient)", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff" }}>Send Reset Link</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", background: "#f0f4f8" }}
      onTouchStart={function (e) {
        if (!isMobile) return;
        const x = e.touches[0].clientX;
        // open when swipe starts from left edge
        if (!sidebarOpen && x < 20) setTouchStartX(x);
        // allow close swipe when sidebar is open
        if (sidebarOpen) setTouchStartX(x);
      }}
      onTouchMove={function (e) {
        if (!isMobile || touchStartX === null) return;
        const diff = e.touches[0].clientX - touchStartX;
        if (!sidebarOpen && diff > 70) { setSidebarOpen(true); setTouchStartX(null); }
        if (sidebarOpen && diff < -70) { setSidebarOpen(false); setTouchStartX(null); }
      }}
      onTouchEnd={function () { if (touchStartX !== null) setTouchStartX(null); }}
      onTouchCancel={function () { if (touchStartX !== null) setTouchStartX(null); }}
    >
      <Head><title>BPIT ScholarPulse</title></Head>
      <style>{`.row-hover:hover td{background:#f0f9ff!important}`}</style>

      {/* SIDEBAR */}
      <div
        onTouchStart={function (e) { if (isMobile && sidebarOpen) setTouchStartX(e.touches[0].clientX); }}
        onTouchMove={function (e) { if (!isMobile || !sidebarOpen || touchStartX === null) return; const diff = e.touches[0].clientX - touchStartX; if (diff < -70) { setSidebarOpen(false); setTouchStartX(null); } }}
        onTouchEnd={function () { if (touchStartX !== null) setTouchStartX(null); }}
        onTouchCancel={function () { if (touchStartX !== null) setTouchStartX(null); }}
        style={{
          width: sidebarOpen ? 248 : 68,
          background: "var(--bg-sidebar)",
          color: "var(--text-sidebar)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s, transform 0.3s, background-color 0.3s ease",
          flexShrink: 0,
          boxShadow: isMobile ? "0 16px 60px rgba(0,0,0,0.5)" : "4px 0 24px rgba(0,0,0,0.15)",
          borderRight: "1px solid var(--border-color)",
          overflow: "hidden",
          position: isMobile ? "fixed" : "relative",
          top: 0,
          left: 0,
          height: isMobile ? "100%" : undefined,
          zIndex: isMobile ? 50 : undefined,
          transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        }}>
        <div style={{ padding: sidebarOpen ? "18px 16px 14px" : "18px 10px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "space-between" : "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="BPIT logo" style={{ height: 32, width: "auto", objectFit: "contain" }} title="BPIT Logo" />
            {sidebarOpen && (
              <div>
                <div style={{ color: "var(--text-sidebar-active)", fontWeight: 900, fontSize: 14, letterSpacing: "-0.01em" }}>ScholarPulse</div>
                <div style={{ color: "var(--accent-primary)", fontSize: 10, fontWeight: 700 }}>BPIT Research ERP</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <img src="/sdc-logo.jpeg" alt="SDC Logo" style={{ height: 26, width: "auto", borderRadius: 4, objectFit: "contain" }} title="Software Development Cell (SDC)" />
          )}
        </div>
        {sidebarOpen && (
          <div style={{ margin: "12px 12px 4px", background: "var(--bg-sidebar-active)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 13, flexShrink: 0 }}>{user.name[0]}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "var(--text-sidebar-active)", fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                <div style={{ marginTop: 2 }}><Badge text={user.role} /></div>
              </div>
            </div>
          </div>
        )}
        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {visibleModules.map(function (m) {
            const isA = active === m.id;
            return (
              <div key={m.id} onClick={function () { setActive(m.id); setShowForm(false); setSearch(""); if (isMobile) setSidebarOpen(false); }}
                className="btn-interactive"
                style={{ display: "flex", alignItems: "center", gap: 14, padding: sidebarOpen ? "10px 20px" : "10px 18px", cursor: "pointer", background: isA ? "var(--bg-sidebar-active)" : "transparent", borderLeft: isA ? "3px solid var(--accent-primary)" : "3px solid transparent", color: isA ? "var(--text-sidebar-active)" : "var(--text-sidebar)", fontWeight: isA ? 700 : 400, fontSize: 13, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{m.icon}</span>
                {sidebarOpen && <span>{m.label}</span>}
                {sidebarOpen && MODULES.includes(m.id) && (data[m.id] || []).length > 0 && (
                  <span style={{ marginLeft: "auto", background: isA ? "var(--accent-primary)" : "rgba(255,255,255,0.12)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 99 }}>{(data[m.id] || []).length}</span>
                )}
              </div>
            );
          })}
        </nav>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {sidebarOpen && (
            <div onClick={handleLogout} className="btn-interactive" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", color: "var(--text-sidebar)", fontSize: 13 }}>
              <span style={{ fontSize: 16 }}>⎋</span><span>Sign Out</span>
            </div>
          )}
          <div onClick={function () { setSidebarOpen(!sidebarOpen); }} style={{ padding: "10px", display: "flex", justifyContent: sidebarOpen ? "flex-end" : "center", cursor: "pointer", color: "var(--text-sidebar)" }}>
            <span>{sidebarOpen ? "◀" : "▶"}</span>
          </div>
        </div>
      </div>
      {isMobile && sidebarOpen && (
        <div onClick={function () { setSidebarOpen(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 45 }} />
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ background: "var(--bg-header)", padding: isMobile ? "0 6px" : "0 24px", height: isMobile ? 56 : 64, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderBottom: "1px solid var(--border-color)", flexShrink: 0, gap: isMobile ? 3 : 14 }}>
          {/* Left Margin: BPIT Logo & Page Title */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 12, minWidth: 0, overflow: "hidden" }}>
            {isMobile && (
              <button onClick={function () { setSidebarOpen(!sidebarOpen); }} style={{ background: "transparent", border: "none", fontSize: 18, cursor: "pointer", padding: "2px", lineHeight: 1, color: "var(--text-primary)", flexShrink: 0 }}>
                ☰
              </button>
            )}
            <img src="/logo.png" alt="BPIT Logo" style={{ height: isMobile ? 24 : 38, width: "auto", objectFit: "contain", flexShrink: 0 }} title="Bhagwan Parshuram Institute of Technology" />
            <span style={{ fontSize: isMobile ? 12 : 17, fontWeight: 800, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {(MODULE_CONFIG.find(function (m) { return m.id === active; }) || {}).icon} {isMobile ? ((MODULE_CONFIG.find(function (m) { return m.id === active; }) || {}).label || "").split(" ")[0] : (MODULE_CONFIG.find(function (m) { return m.id === active; }) || {}).label}
            </span>
          </div>

          {/* Right Margin: Controls & SDC Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 3 : 10, flexShrink: 0 }}>
            {/* Theme Selector */}
            <select
              value={theme}
              onChange={function (e) { setTheme(e.target.value); }}
              className="btn-interactive"
              style={{
                padding: isMobile ? "3px 2px" : "7px 12px",
                border: "1.5px solid var(--border-color)",
                borderRadius: 8,
                fontSize: isMobile ? 11 : 13,
                color: "var(--text-primary)",
                background: "var(--bg-surface-secondary)",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer",
                maxWidth: isMobile ? 36 : undefined
              }}
              title="Change ERP Theme"
            >
              {THEMES.map(function (t) {
                return <option key={t.id} value={t.id}>{isMobile ? t.icon : t.icon + " " + t.label}</option>;
              })}
            </select>

            {/* Squeezed Academic Year Selector on Mobile */}
            {active !== "users" && active !== "branches" && (
              <select value={filterYear} onChange={function (e) { setFilterYear(e.target.value); }}
                style={{
                  padding: isMobile ? "3px 2px" : "7px 12px",
                  border: "1.5px solid var(--border-color)",
                  borderRadius: 8,
                  fontSize: isMobile ? 10 : 13,
                  color: "var(--text-primary)",
                  background: "var(--bg-surface-secondary)",
                  fontWeight: 700,
                  outline: "none",
                  maxWidth: isMobile ? 46 : undefined,
                  textOverflow: "ellipsis"
                }}
                title="Filter by Academic Year"
              >
                <option value="All">{isMobile ? "Yr" : "All Years"}</option>
                {ACADEMIC_YEARS.map(function (y) {
                  const parts = y.split("-");
                  const shortYear = parts.length === 2 ? `${parts[0].slice(-2)}-${parts[1]}` : y;
                  return <option key={y} value={y}>{isMobile ? shortYear : y}</option>;
                })}
              </select>
            )}

            {MODULES.includes(active) && FIELD_CONFIGS[active] && (
              <div style={{ display: "flex", gap: isMobile ? 2 : 8 }}>
                <button onClick={function () { exportToExcel(active, filtered, FIELD_CONFIGS); }} className="btn-interactive" style={{ padding: isMobile ? "4px 5px" : "7px 14px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: isMobile ? 10 : 12, cursor: "pointer", whiteSpace: "nowrap" }} title="Export to Excel">{isMobile ? "⬇" : "⬇ Excel"}</button>
                <button onClick={function () { printToPDF(active, filtered, FIELD_CONFIGS, FIELD_CONFIGS[active].title, filterDept, filterYear); }} className="btn-interactive" style={{ padding: isMobile ? "4px 5px" : "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: isMobile ? 10 : 12, cursor: "pointer", whiteSpace: "nowrap" }} title="Print PDF">{isMobile ? "🖨" : "🖨 PDF"}</button>
              </div>
            )}

            <div style={{ width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: isMobile ? 11 : 13, cursor: "pointer", flexShrink: 0 }} title={user.name}>{user.name[0]}</div>

            {/* SDC Logo on Right Margin */}
            <div style={{ display: "flex", alignItems: "center", paddingLeft: isMobile ? 2 : 8, borderLeft: "1px solid var(--border-color)", height: isMobile ? 28 : 36, flexShrink: 0 }}>
              <img src="/sdc-logo.jpeg" alt="SDC Logo" style={{ height: isMobile ? 24 : 36, width: "auto", borderRadius: 5, objectFit: "contain" }} title="Software Development Cell (SDC)" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? 16 : 24, background: "var(--bg-app)" }}>
          <Toast toast={toast} />

          {/* PROFILE */}
          {active === "profile" && <ProfileView user={user} showToast={showToast} isMobile={isMobile} />}

          {/* DASHBOARD */}
          {active === "dashboard" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(" + (isMobile ? "120px" : "155px") + ",1fr))", gap: 16, marginBottom: 24 }}>
                {Object.entries(FIELD_CONFIGS).map(function (entry) {
                  const key = entry[0]; const cfg = entry[1];
                  const cnt = byMod[key] || 0;
                  const mod = MODULE_CONFIG.find(function (m) { return m.id === key; });
                  return (
                    <div key={key} onClick={function () { setActive(key); if (isMobile) setSidebarOpen(false); }}
                      className="hover-lift"
                      style={{ background: "var(--bg-surface)", color: "var(--text-primary)", borderRadius: 14, padding: "20px", boxShadow: "var(--card-shadow)", borderTop: "4px solid " + cfg.color, borderLeft: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", cursor: "pointer" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{mod ? mod.icon : "📄"}</div>
                      <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{cnt}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontWeight: 600 }}>{cfg.title}</div>
                    </div>
                  );
                })}
                <div className="hover-lift" style={{ background: "var(--accent-gradient)", borderRadius: 14, padding: "20px", boxShadow: "var(--card-shadow)" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{totalRecs}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4, fontWeight: 600 }}>Total Records</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(" + (isMobile ? "100%" : "260px") + ",1fr))", gap: 20, marginBottom: 20 }}>
                <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "20px 16px", boxShadow: "var(--card-shadow)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>📈 By Department</div>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={barData} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "var(--bg-surface)", borderRadius: 8, border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: 12 }} />
                        <Bar dataKey="count" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState label="No data yet" />}
                </div>
                <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "20px 16px", boxShadow: "var(--card-shadow)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>🥧 By Category</div>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3}>
                          {pieData.map(function (_, i) { return <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />; })}
                        </Pie>
                        <Tooltip contentStyle={{ background: "var(--bg-surface)", borderRadius: 8, border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: 12 }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyState label="No data yet" />}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
                <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "20px 16px", boxShadow: "var(--card-shadow)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>📅 Year-wise Trend</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={yearData} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis dataKey="year" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "var(--bg-surface)", borderRadius: 8, border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: 12 }} />
                      <Bar dataKey="count" fill="var(--accent-primary)" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "20px", boxShadow: "var(--card-shadow)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", marginBottom: 16 }}>🕐 Recent Submissions</div>
                  {Object.entries(FIELD_CONFIGS).flatMap(function (entry) {
                    const k = entry[0];
                    return (data[k] || []).slice(0, 1).map(function (r) { return Object.assign({}, r, { _mod: k }); });
                  }).slice(0, 5).map(function (r) {
                    const mod = MODULE_CONFIG.find(function (m) { return m.id === r._mod; });
                    return (
                      <div key={r.id + r._mod} className="row-hover" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "9px 8px", borderBottom: "1px solid var(--border-subtle)", borderRadius: 8, cursor: "pointer" }} onClick={function () { setActive(r._mod); setViewRecord(r); if (isMobile) setSidebarOpen(false); }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{mod ? mod.icon : "📄"}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{FIELD_CONFIGS[r._mod] ? FIELD_CONFIGS[r._mod].title : r._mod} • {r.department} • {r.academicYear}</div>
                        </div>
                      </div>
                    );
                  })}
                  {totalRecs === 0 && <EmptyState label="No submissions yet" />}
                </div>
              </div>
              {user.role === "admin" && (
                <DepartmentFacultyExplorer
                  users={users}
                  data={data}
                  departments={departments}
                  filterYear={filterYear}
                  FIELD_CONFIGS={FIELD_CONFIGS}
                  isMobile={isMobile}
                  showToast={showToast}
                  onSelectFaculty={function (f) { setSelectedFacultyModal(f); }}
                />
              )}
              {user.role === "admin" && (
                <div style={{ marginTop: 20, background: "var(--bg-surface)", borderRadius: 14, padding: "20px", boxShadow: "var(--card-shadow)", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>⚡ Quick Export</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {ACADEMIC_YEARS.slice(-4).map(function (y) {
                      return <button key={y} onClick={function () { exportAllToExcel(data, FIELD_CONFIGS, y, showToast); }} className="btn-interactive" style={{ padding: "9px 18px", background: "var(--bg-surface-secondary)", color: "var(--accent-primary)", border: "1.5px solid var(--border-color)", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📥 {y}</button>;
                    })}
                    <button onClick={function () { exportAllToExcel(data, FIELD_CONFIGS, "All", showToast); }} className="btn-interactive" style={{ padding: "9px 18px", background: "var(--accent-gradient)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📥 Export All</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE TABLE */}
          {MODULES.includes(active) && FIELD_CONFIGS[active] && (
            <div style={{ background: "var(--bg-surface)", borderRadius: 16, boxShadow: "var(--card-shadow)", overflow: "hidden", border: "1px solid var(--border-color)" }}>
              {/* Header Controls */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: isMobile ? "space-between" : "flex-start" }}>
                <button onClick={function () {
                  const initial = { academicYear: CURRENT_YEAR };
                  if (FIELD_CONFIGS[active].fields.some(function (f) { return f.name === "department"; })) {
                    initial.department = user.dept || "";
                  }
                  setForm(initial);
                  setEditRecord(null);
                  setShowForm(true);
                }}
                  className="btn-interactive"
                  style={{ padding: "9px 18px", background: "var(--accent-gradient)", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  + {isMobile ? "Add" : FIELD_CONFIGS[active].title}
                </button>

                <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "1", minWidth: isMobile ? 0 : 220 }}>
                  <input
                    id="erp-search-input"
                    value={search}
                    onChange={function (e) { setSearch(e.target.value); }}
                    placeholder="🔍  Search records (Ctrl + K)..."
                    style={Object.assign({}, INPUT, { paddingRight: search ? 34 : 14 })}
                  />
                  {search && (
                    <button onClick={function () { setSearch(""); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>✕</button>
                  )}
                </div>

                <select value={filterDept} onChange={function (e) { setFilterDept(e.target.value); }} style={Object.assign({}, INPUT, { width: "auto", flex: isMobile ? "1 1 auto" : "none" })}>
                  <option value="All">All Depts</option>
                  {departments.map(function (d) { return <option key={d}>{d}</option>; })}
                </select>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginLeft: isMobile ? "0" : "auto", whiteSpace: "nowrap", flex: isMobile ? "1 1 100%" : "auto", textAlign: isMobile ? "left" : "right" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Status Filter Chips */}
              <div style={{ padding: "10px 20px", background: "var(--bg-surface-secondary)", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Filter Status:</span>
                {["All", "Published", "Accepted", "Filed", "Granted", "Under Review"].map(function (st) {
                  const isActive = statusFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={function () { setStatusFilter(st); }}
                      className="btn-interactive"
                      style={{
                        padding: "3px 10px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                        border: isActive ? "1px solid var(--accent-primary)" : "1px solid var(--border-color)",
                        background: isActive ? "var(--accent-primary)" : "var(--bg-surface)",
                        color: isActive ? "#ffffff" : "var(--text-secondary)",
                        cursor: "pointer"
                      }}
                    >
                      {st}
                    </button>
                  );
                })}
                {statusFilter !== "All" && (
                  <button onClick={function () { setStatusFilter("All"); }} style={{ background: "none", border: "none", color: "var(--accent-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", marginLeft: 4 }}>Clear Filter</button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>No records found</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Try clearing search or filters, or click "+ Add" to submit a new record</div>
                </div>
              ) : (
                isMobile ? (
                  <div style={{ display: "grid", gap: 14, padding: 12 }}>
                    {filtered.map(function (row, idx) {
                      const previewCols = FIELD_CONFIGS[active].columns.slice(0, 3);
                      const rowKey = active + "-" + row.id;
                      const isExpanded = expandedRows.includes(rowKey);
                      const remainingCols = FIELD_CONFIGS[active].columns.slice(3);
                      return (
                        <div key={row.id} style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 16, boxShadow: "var(--card-shadow)", border: "1px solid var(--border-color)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", flex: 1, wordBreak: "break-word", lineHeight: 1.3 }}>{row[previewCols[0]] || row.title || "Record"}</div>
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexShrink: 0 }}>
                              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{idx + 1}</div>
                              <button onClick={function () {
                                setExpandedRows(function (prev) {
                                  return prev.includes(rowKey) ? prev.filter(function (x) { return x !== rowKey; }) : [...prev, rowKey];
                                });
                              }} style={Object.assign({}, Btn("view"), { padding: "6px 10px", fontSize: 11, whiteSpace: "nowrap" })}>
                                {isExpanded ? "Hide" : "Show"} Details
                              </button>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                            {previewCols.map(function (col) {
                              const labelIndex = FIELD_CONFIGS[active].columns.indexOf(col);
                              const label = FIELD_CONFIGS[active].colLabels[labelIndex] || col;
                              const value = row[col] || "—";
                              return (
                                <div key={col} style={{ background: "var(--bg-surface-secondary)", borderRadius: 12, padding: 12 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
                                  <div style={{ fontSize: 13, color: "var(--text-secondary)", wordBreak: "break-word" }}>{STATUS_COLORS[value] ? <Badge text={value} /> : value}</div>
                                </div>
                              );
                            })}
                            <div style={{ background: "var(--bg-surface-secondary)", borderRadius: 12, padding: 12 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Academic Year</div>
                              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.academicYear || "—"}</div>
                            </div>
                            {user.role === "admin" && (
                              <div style={{ background: "var(--bg-surface-secondary)", borderRadius: 12, padding: 12 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Submitted By</div>
                                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.submittedByName || "—"}</div>
                              </div>
                            )}
                          </div>
                          {isExpanded && remainingCols.length > 0 && (
                            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                              {remainingCols.map(function (col) {
                                const labelIndex = FIELD_CONFIGS[active].columns.indexOf(col);
                                const label = FIELD_CONFIGS[active].colLabels[labelIndex] || col;
                                const value = row[col] || "—";
                                return (
                                  <div key={col} style={{ background: "var(--bg-surface-secondary)", borderRadius: 12, padding: 12 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: 13, color: "var(--text-secondary)", wordBreak: "break-word" }}>{STATUS_COLORS[value] ? <Badge text={value} /> : value}</div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                            <button onClick={function () { setViewRecord(row); }} className="btn-interactive" style={Btn("view")}>View</button>
                            {canEdit(row) && <button onClick={function () { handleEdit(row); }} className="btn-interactive" style={Btn("edit")}>Edit</button>}
                            {(user.role === "admin" || canEdit(row)) && <button onClick={function () { setConfirmDelete(row.id); }} className="btn-interactive" style={Btn("del")}>Del</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--table-th-bg)" }}>
                          <th style={TH}>#</th>
                          {FIELD_CONFIGS[active].columns.map(function (col, idx) {
                            const label = FIELD_CONFIGS[active].colLabels[idx] || col;
                            const isSorted = sortField === col;
                            return (
                              <th key={col} onClick={function () { handleSort(col); }} className="sortable-th" style={TH} title="Click to sort by this column">
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span>{label}</span>
                                  <span style={{ color: isSorted ? "var(--accent-primary)" : "var(--text-muted)", fontSize: 10 }}>
                                    {isSorted ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                                  </span>
                                </div>
                              </th>
                            );
                          })}
                          <th onClick={function () { handleSort("academicYear"); }} className="sortable-th" style={TH} title="Click to sort by Academic Year">
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span>Acad. Year</span>
                              <span style={{ color: sortField === "academicYear" ? "var(--accent-primary)" : "var(--text-muted)", fontSize: 10 }}>
                                {sortField === "academicYear" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                              </span>
                            </div>
                          </th>
                          {user.role === "admin" && <th style={TH}>Submitted By</th>}
                          <th style={TH}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(function (row, idx) {
                          return (
                            <tr key={row.id} className="row-hover" style={{ background: idx % 2 === 0 ? "var(--bg-surface)" : "var(--table-tr-alt)" }}>
                              <td style={Object.assign({}, TD, { color: "var(--text-muted)", fontWeight: 700, fontSize: 12 })}>{idx + 1}</td>
                              {FIELD_CONFIGS[active].columns.map(function (col) {
                                return (
                                  <td key={col} style={TD}>
                                    {STATUS_COLORS[row[col]] ? <Badge text={row[col]} /> : (
                                      <span style={{ display: "block", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row[col]}>{row[col] || "—"}</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td style={TD}><Badge text={row.academicYear || "—"} /></td>
                              {user.role === "admin" && <td style={TD}><span style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.submittedByName || "—"}</span></td>}
                              <td style={Object.assign({}, TD, { whiteSpace: "nowrap" })}>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button onClick={function () { setViewRecord(row); }} className="btn-interactive" style={Btn("view")}>View</button>
                                  {canEdit(row) && <button onClick={function () { handleEdit(row); }} className="btn-interactive" style={Btn("edit")}>Edit</button>}
                                  {(user.role === "admin" || canEdit(row)) && <button onClick={function () { setConfirmDelete(row.id); }} className="btn-interactive" style={Btn("del")}>Del</button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}

          {active === "users" && user.role === "admin" && <UsersPanel users={users} setUsers={setUsers} setDemoUsers={setDemoUsers} showToast={showToast} data={data} setData={setData} departments={departments} isMobile={isMobile} />}
          {active === "branches" && user.role === "admin" && <BranchesPanel departments={departments} setDepartments={setDepartments} showToast={showToast} isMobile={isMobile} />}
          {active === "reports" && user.role === "admin" && <ReportsPanel data={data} users={users} filterYear={filterYear} FIELD_CONFIGS={FIELD_CONFIGS} showToast={showToast} isMobile={isMobile} />}

          <footer style={{ marginTop: 36, paddingTop: 16, borderTop: "1px solid var(--border-color)", textAlign: "center", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
            © {new Date().getFullYear()} Bhagwan Parshuram Institute of Technology • Developed & Maintained by Dr. Aman Dureja, Department of IT, Member-Software Development Cell (SDC)
          </footer>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showForm && MODULES.includes(active) && FIELD_CONFIGS[active] && (
        <Modal onClose={function () { setShowForm(false); setEditRecord(null); setForm({}); }} isMobile={isMobile}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f2942" }}>{editRecord ? "Edit" : "Add New"} {FIELD_CONFIGS[active].title}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Fields marked * are required</div>
            </div>
            <button onClick={function () { setShowForm(false); setEditRecord(null); setForm({}); }} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, color: "#64748b" }}>✕</button>
          </div>
          {["journals", "conferences", "bookchapters", "patents"].includes(active) && (
            <DoiLookup active={active} setForm={setForm} showToast={showToast} user={user} isMobile={isMobile} />
          )}
          <FormFields fields={FIELD_CONFIGS[active].fields} form={form} setForm={setForm} departments={departments} isMobile={isMobile} />
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
            <button onClick={function () { setShowForm(false); setEditRecord(null); setForm({}); }} style={{ padding: "10px 22px", background: "#f1f5f9", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151" }}>Cancel</button>
            <button onClick={handleSubmit} style={{ padding: "10px 28px", background: "linear-gradient(135deg,#0f2942,#2563eb)", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff" }}>
              {editRecord ? "Update Record" : "Save Record"} ✓
            </button>
          </div>
        </Modal>
      )}

      {/* VIEW MODAL */}
      {viewRecord && FIELD_CONFIGS[active] && (
        <Modal onClose={function () { setViewRecord(null); }} width={540} isMobile={isMobile}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f2942" }}>Record Details</div>
            <button onClick={function () { setViewRecord(null); }} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, color: "#64748b" }}>✕</button>
          </div>
          <div style={{ background: FIELD_CONFIGS[active].color + "10", borderLeft: "4px solid " + (FIELD_CONFIGS[active].color), borderRadius: "0 8px 8px 0", padding: "10px 14px", marginBottom: 16, fontSize: 15, fontWeight: 700, color: "#0f2942" }}>{viewRecord.title}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 0 }}>
            {Object.entries(viewRecord).filter(function (e) { return !["id", "submittedById"].includes(e[0]); }).map(function (e) {
              const k = e[0]; const v = e[1];
              return (
                <div key={k} style={{ padding: "9px 12px", borderBottom: "1px solid #f1f5f9", gridColumn: ["title", "authors", "inventors", "faculty", "editors"].includes(k) ? "span 2" : "span 1" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{k.replace(/([A-Z])/g, " $1").trim()}</div>
                  <div style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{STATUS_COLORS[v] ? <Badge text={v} /> : (v || "—")}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
            {canEdit(viewRecord) && <button onClick={function () { handleEdit(viewRecord); setViewRecord(null); }} style={Object.assign({}, Btn("edit"), { padding: "9px 18px" })}>Edit Record</button>}
            <button onClick={function () { setViewRecord(null); }} style={{ padding: "9px 18px", background: "#f1f5f9", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Close</button>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <Modal onClose={function () { setConfirmDelete(null); }} width={380} isMobile={isMobile}>
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🗑</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f2942", marginBottom: 8 }}>Delete this record?</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>This action cannot be undone.</div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={function () { setConfirmDelete(null); }} style={{ padding: "10px 24px", background: "#f1f5f9", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={function () { handleDelete(confirmDelete); }} style={{ padding: "10px 24px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Delete</button>
          </div>
        </Modal>
      )}

      {/* FACULTY COMPLETE DETAIL MODAL (ADMIN DASHBOARD) */}
      {selectedFacultyModal && (
        <FacultyCompleteDetailModal
          faculty={selectedFacultyModal}
          data={data}
          filterYear={filterYear}
          FIELD_CONFIGS={FIELD_CONFIGS}
          departments={departments}
          isMobile={isMobile}
          showToast={showToast}
          onClose={function () { setSelectedFacultyModal(null); }}
        />
      )}
    </div>
  );
}