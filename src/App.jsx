import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "kshs_research_archive_v4";

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function parseTags(text) {
  return String(text || "")
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

function normalizeEntry(entry) {
  return {
    ...entry,
    description: entry.description || "",
    hashtags: entry.hashtags || "",
    likes: Number(entry.likes || 0),
    views: Number(entry.views || 0),
    coverData: entry.coverData || entry.coverImageDataUrl || "",
    fileData: entry.fileData || entry.fileDataUrl || "",
    fileName: entry.fileName || "download",
    createdAt: Number(entry.createdAt || Date.now()),
  };
}

function formatStudentLabel(entry) {
  return `${entry.studentId} ${entry.name}`;
}

const css = `
  * {
    box-sizing: border-box;
  }

  html, body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
  }

  body {
    background:
      radial-gradient(circle at top left, rgba(212, 191, 153, 0.28), transparent 28%),
      radial-gradient(circle at bottom right, rgba(58, 76, 110, 0.18), transparent 26%),
      linear-gradient(180deg, #f8f5ef 0%, #efe8dc 100%);
    color: #1d2736;
    font-family: "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  }

  button, input, textarea, select {
    font: inherit;
  }

  .archive-page {
    min-height: 100vh;
    padding: 34px 16px 28px;
  }

  .archive-wrap {
    max-width: 1240px;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    gap: 36px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .hero-copy {
    width: 360px;
    padding-top: 12px;
  }

  .hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(255,255,255,0.72);
    border: 1px solid rgba(31, 54, 92, 0.12);
    color: #5b6c86;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .hero-title {
    margin: 18px 0 20px;
    font-size: 40px;
    line-height: 1.14;
    letter-spacing: -0.04em;
    font-weight: 800;
    color: #1a2740;
  }

  .feature-list {
    display: grid;
    gap: 12px;
    margin-top: 0;
  }

  .feature-card {
    padding: 16px 16px;
    border-radius: 18px;
    background: rgba(255,255,255,0.68);
    border: 1px solid rgba(31, 54, 92, 0.08);
    box-shadow: 0 12px 30px rgba(24, 35, 53, 0.06);
  }

  .feature-card strong {
    display: block;
    margin-bottom: 5px;
    color: #24324a;
    font-size: 14px;
  }

  .feature-card span {
    color: #667487;
    font-size: 13px;
    line-height: 1.75;
  }

  .phone-shell {
    width: 390px;
    min-height: 760px;
    border-radius: 34px;
    background: rgba(255,255,255,0.8);
    border: 1px solid rgba(31, 54, 92, 0.1);
    box-shadow:
      0 20px 50px rgba(28, 40, 60, 0.12),
      inset 0 1px 0 rgba(255,255,255,0.65);
    backdrop-filter: blur(18px);
    overflow: hidden;
    position: relative;
  }

  .phone-inner {
    padding: 22px 20px 24px;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 12px;
  }

  .brand-group {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
    border-radius: 14px;
    background: linear-gradient(135deg, #1f365c 0%, #2f528d 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    box-shadow: 0 10px 20px rgba(31, 54, 92, 0.22);
    flex-shrink: 0;
  }

  .brand-title {
    font-size: 15px;
    font-weight: 800;
    color: #1f2d45;
    letter-spacing: -0.02em;
  }

  .brand-subtitle {
    font-size: 12px;
    color: #768396;
    margin-top: 2px;
  }

  .grade-pill {
    min-width: 74px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid rgba(31, 54, 92, 0.12);
    background: rgba(255,255,255,0.88);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    color: #55657c;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .headline-box {
    margin-bottom: 18px;
  }

  .headline-box h2 {
    margin: 0;
    font-size: 28px;
    line-height: 1.22;
    letter-spacing: -0.04em;
    color: #172338;
  }

  .headline-box p {
    margin: 10px 0 0;
    color: #6a7788;
    font-size: 14px;
    line-height: 1.7;
  }

  .search-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 54px;
    border-radius: 18px;
    border: 1px solid rgba(31, 54, 92, 0.1);
    background: rgba(248, 246, 242, 0.96);
    padding: 0 16px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
  }

  .search-wrap input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: #243149;
    font-size: 15px;
  }

  .search-wrap input::placeholder,
  .field-input::placeholder,
  .field-textarea::placeholder {
    color: #98a2b1;
  }

  .search-icon {
    color: #8a96a6;
    font-size: 16px;
  }

  .home-search {
    margin-bottom: 18px;
  }

  .primary-button {
    width: 100%;
    height: 110px;
    border: none;
    border-radius: 28px;
    background: linear-gradient(135deg, #233a63 0%, #2f4f84 65%, #bc9754 100%);
    color: white;
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.03em;
    box-shadow: 0 18px 30px rgba(35, 58, 99, 0.24);
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    margin-bottom: 24px;
  }

  .primary-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 34px rgba(35, 58, 99, 0.26);
  }

  .section-card {
    border-radius: 28px;
    background: rgba(249, 247, 243, 0.9);
    border: 1px solid rgba(31, 54, 92, 0.08);
    padding: 16px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  }

  .section-label {
    margin-bottom: 14px;
    font-size: 13px;
    font-weight: 800;
    color: #778294;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .grade-grid {
    display: grid;
    gap: 12px;
  }

  .grade-grid.one {
    grid-template-columns: 1fr;
    margin-bottom: 12px;
  }

  .grade-grid.two {
    grid-template-columns: 1fr 1fr;
  }

  .grade-button {
    height: 88px;
    border: 1px solid rgba(31, 54, 92, 0.09);
    border-radius: 24px;
    background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,240,233,0.96));
    color: #203150;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.03em;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    box-shadow: 0 12px 24px rgba(28, 40, 60, 0.07);
  }

  .grade-button:hover,
  .ghost-button:hover,
  .footer-button:hover,
  .upload-action:hover,
  .grade-toggle:hover,
  .entry-thumb:hover,
  .home-result-card:hover,
  .like-button:hover,
  .download-button:hover,
  .sort-select:hover {
    transform: translateY(-1px);
  }

  .grade-button:hover {
    border-color: rgba(47, 79, 132, 0.28);
    box-shadow: 0 16px 28px rgba(31, 54, 92, 0.1);
  }

  .home-note {
    margin-top: 18px;
    padding: 15px 16px;
    border-radius: 18px;
    background: rgba(255,255,255,0.76);
    border: 1px solid rgba(31, 54, 92, 0.08);
    color: #647284;
    font-size: 13px;
    line-height: 1.8;
  }

  .home-result-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 18px;
  }

  .home-result-card {
    display: flex;
    gap: 12px;
    align-items: center;
    border: 1px solid rgba(31, 54, 92, 0.08);
    background: rgba(255,255,255,0.82);
    border-radius: 20px;
    padding: 10px;
    cursor: pointer;
    box-shadow: 0 12px 24px rgba(28, 40, 60, 0.05);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .home-result-card img {
    width: 86px;
    height: 86px;
    object-fit: cover;
    border-radius: 16px;
    flex-shrink: 0;
  }

  .home-result-meta {
    min-width: 0;
  }

  .home-result-grade {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(35, 58, 99, 0.08);
    color: #27406a;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 6px;
  }

  .home-result-title {
    color: #23314b;
    font-weight: 800;
    font-size: 15px;
    line-height: 1.45;
    margin-bottom: 4px;
    word-break: break-word;
  }

  .home-result-name {
    color: #6c7a8d;
    font-size: 13px;
  }

  .page-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 23px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #19253a;
  }

  .page-subtitle {
    margin-top: 4px;
    color: #788598;
    font-size: 13px;
    line-height: 1.65;
  }

  .ghost-button,
  .footer-button,
  .upload-action,
  .grade-toggle,
  .download-button,
  .like-button,
  .sort-select {
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }

  .ghost-button {
    height: 38px;
    border-radius: 999px;
    border: 1px solid rgba(31, 54, 92, 0.1);
    background: rgba(255,255,255,0.82);
    color: #2a3d5f;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 700;
  }

  .sort-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 14px 0 12px;
  }

  .sort-select {
    height: 40px;
    border-radius: 14px;
    border: 1px solid rgba(31, 54, 92, 0.12);
    background: rgba(255,255,255,0.92);
    color: #22324d;
    padding: 0 12px;
    box-shadow: 0 8px 18px rgba(28, 40, 60, 0.05);
  }

  .grade-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 0 0 14px;
  }

  .result-count {
    color: #728092;
    font-size: 13px;
    font-weight: 700;
  }

  .list-wrap {
    height: 530px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .list-wrap::-webkit-scrollbar {
    width: 8px;
  }

  .list-wrap::-webkit-scrollbar-thumb {
    background: rgba(44, 64, 95, 0.18);
    border-radius: 999px;
  }

  .entry-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding-bottom: 14px;
  }

  .empty-card,
  .entry-card {
    border-radius: 24px;
    background: rgba(255,255,255,0.78);
    border: 1px solid rgba(31, 54, 92, 0.08);
    box-shadow: 0 14px 28px rgba(28, 40, 60, 0.08);
  }

  .empty-card {
    padding: 34px 22px;
    text-align: center;
    color: #687688;
    line-height: 1.8;
    font-size: 15px;
  }

  .entry-card {
    padding: 10px;
  }

  .entry-thumb {
    width: 100%;
    height: 230px;
    border: none;
    border-radius: 18px;
    overflow: hidden;
    position: relative;
    padding: 0;
    display: block;
    background: #ece7df;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);
    cursor: pointer;
  }

  .entry-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .entry-overlay {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(18, 29, 47, 0.76);
    color: white;
    font-size: 12px;
    font-weight: 700;
    padding: 7px 10px;
    border-radius: 999px;
    backdrop-filter: blur(8px);
  }

  .entry-caption {
    margin-top: 10px;
    padding: 14px 14px 15px;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(248,246,242,0.96), rgba(242,236,227,0.96));
    color: #23324b;
    font-size: 15px;
    line-height: 1.7;
    word-break: break-word;
  }

  .entry-caption strong {
    display: block;
    font-size: 13px;
    color: #8a7960;
    font-weight: 800;
    margin-bottom: 4px;
    letter-spacing: 0.03em;
  }

  .entry-description-preview {
    margin-top: 8px;
    color: #6f7d8f;
    font-size: 13px;
    line-height: 1.65;
  }

  .entry-stats {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 12px;
  }

  .stat-group {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #677487;
    font-size: 13px;
    font-weight: 700;
  }

  .like-button {
    height: 38px;
    min-width: 70px;
    border-radius: 12px;
    border: 1px solid rgba(31, 54, 92, 0.1);
    background: rgba(255,255,255,0.92);
    color: #c24568;
    font-weight: 800;
    box-shadow: 0 8px 16px rgba(28, 40, 60, 0.05);
  }

  .footer-actions {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 16px;
  }

  .footer-button {
    flex: 1;
    height: 48px;
    border-radius: 16px;
    border: 1px solid rgba(31, 54, 92, 0.1);
    background: rgba(255,255,255,0.84);
    color: #233450;
    font-weight: 700;
    box-shadow: 0 10px 18px rgba(28, 40, 60, 0.05);
  }

  .footer-button.primary {
    background: linear-gradient(135deg, #223962 0%, #315387 100%);
    color: white;
    border: none;
    box-shadow: 0 16px 26px rgba(35, 58, 99, 0.22);
  }

  .grade-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }

  .grade-toggle {
    height: 52px;
    border-radius: 16px;
    border: 1px solid rgba(31, 54, 92, 0.1);
    background: rgba(255,255,255,0.88);
    color: #30425f;
    font-weight: 800;
    box-shadow: 0 8px 18px rgba(28, 40, 60, 0.05);
  }

  .grade-toggle.active {
    background: linear-gradient(135deg, #223962 0%, #315387 100%);
    color: white;
    border: none;
    box-shadow: 0 14px 24px rgba(35, 58, 99, 0.22);
  }

  .field-group {
    margin-bottom: 14px;
  }

  .field-label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 800;
    color: #6f7e92;
    letter-spacing: 0.03em;
  }

  .field-input,
  .field-textarea {
    width: 100%;
    border: 1px solid rgba(31, 54, 92, 0.1);
    background: rgba(248,246,242,0.96);
    color: #22324d;
    outline: none;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.55);
  }

  .field-input {
    height: 54px;
    padding: 0 15px;
    border-radius: 16px;
  }

  .field-textarea {
    min-height: 118px;
    padding: 14px 15px;
    border-radius: 18px;
    resize: none;
    line-height: 1.6;
  }

  .upload-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 20px;
  }

  .upload-action {
    min-height: 88px;
    border-radius: 18px;
    border: 1px solid rgba(31, 54, 92, 0.1);
    background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,240,233,0.96));
    color: #22324d;
    font-weight: 800;
    font-size: 16px;
    box-shadow: 0 12px 22px rgba(28, 40, 60, 0.06);
  }

  .upload-file-name {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(31, 54, 92, 0.08);
    color: #69778a;
    font-size: 12px;
    line-height: 1.7;
    word-break: break-all;
  }

  .error-box {
    margin-top: 16px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(255, 239, 237, 0.95);
    border: 1px solid rgba(198, 74, 54, 0.18);
    color: #a64534;
    font-size: 13px;
    line-height: 1.7;
  }

  .detail-shell {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .detail-cover {
    width: 100%;
    height: 250px;
    object-fit: cover;
    border-radius: 22px;
    display: block;
    background: #ece7df;
  }

  .detail-card {
    padding: 16px;
    border-radius: 22px;
    background: rgba(255,255,255,0.82);
    border: 1px solid rgba(31, 54, 92, 0.08);
    box-shadow: 0 14px 28px rgba(28, 40, 60, 0.06);
  }

  .detail-topic {
    font-size: 24px;
    font-weight: 800;
    line-height: 1.3;
    color: #1d2940;
    margin: 0 0 8px;
    letter-spacing: -0.03em;
  }

  .detail-meta {
    color: #6f7d8f;
    font-size: 14px;
    line-height: 1.7;
  }

  .detail-description {
    margin-top: 14px;
    color: #33445e;
    font-size: 14px;
    line-height: 1.85;
    white-space: pre-wrap;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 11px;
    border-radius: 999px;
    background: rgba(35, 58, 99, 0.08);
    color: #26406a;
    font-size: 12px;
    font-weight: 800;
  }

  .detail-stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 16px;
  }

  .download-button {
    width: 100%;
    height: 52px;
    border-radius: 16px;
    border: none;
    background: linear-gradient(135deg, #223962 0%, #315387 100%);
    color: white;
    font-weight: 800;
    box-shadow: 0 16px 26px rgba(35, 58, 99, 0.22);
  }

  @media (max-width: 980px) {
    .hero-copy {
      width: 100%;
      max-width: 700px;
      padding-top: 0;
    }

    .hero-title {
      font-size: 34px;
    }
  }

  @media (max-width: 480px) {
    .archive-page {
      padding: 20px 10px 22px;
    }

    .phone-shell {
      width: 100%;
      min-height: 720px;
      border-radius: 28px;
    }

    .phone-inner {
      padding: 18px 16px 22px;
    }

    .headline-box h2 {
      font-size: 24px;
    }

    .primary-button {
      height: 96px;
      font-size: 30px;
    }

    .hero-title {
      font-size: 30px;
    }
  }
`;

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [homeSearchText, setHomeSearchText] = useState("");
  const [gradeSearchText, setGradeSearchText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [uploadGrade, setUploadGrade] = useState(1);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [fileObject, setFileObject] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sortByGrade, setSortByGrade] = useState({ 1: "latest", 2: "latest", 3: "latest" });

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved).map(normalizeEntry);
        setEntries(parsed);
      }
    } catch (e) {
      console.error("Failed to load saved entries", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error("Failed to save entries", e);
    }
  }, [entries]);

  const currentSort = selectedGrade ? sortByGrade[selectedGrade] || "latest" : "latest";

  const selectedEntry = useMemo(() => {
    return entries.find((entry) => entry.id === selectedEntryId) || null;
  }, [entries, selectedEntryId]);

  const homeResults = useMemo(() => {
    const keyword = homeSearchText.trim().toLowerCase();
    if (!keyword) return [];

    return [...entries]
      .filter((entry) => {
        const haystack = `${entry.studentId} ${entry.name} ${entry.topic} ${entry.description} ${entry.hashtags}`.toLowerCase();
        return haystack.includes(keyword);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [entries, homeSearchText]);

  const filteredEntries = useMemo(() => {
    if (!selectedGrade) return [];
    const keyword = gradeSearchText.trim().toLowerCase();

    let next = entries
      .filter((entry) => entry.grade === selectedGrade)
      .filter((entry) => {
        if (!keyword) return true;
        const haystack = `${entry.studentId} ${entry.name} ${entry.topic} ${entry.description} ${entry.hashtags}`.toLowerCase();
        return haystack.includes(keyword);
      });

    if (currentSort === "likes") {
      next = [...next].sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt);
    } else if (currentSort === "views") {
      next = [...next].sort((a, b) => b.views - a.views || b.createdAt - a.createdAt);
    } else {
      next = [...next].sort((a, b) => b.createdAt - a.createdAt);
    }

    return next;
  }, [entries, selectedGrade, gradeSearchText, currentSort]);

  const resetUploadForm = () => {
    setUploadGrade(selectedGrade || 1);
    setStudentId("");
    setName("");
    setTopic("");
    setDescription("");
    setHashtags("");
    setFileObject(null);
    setCoverImageFile(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const goToHome = () => {
    setPage("home");
    setSelectedGrade(null);
    setSelectedEntryId(null);
    setGradeSearchText("");
    setErrorMessage("");
  };

  const openGradePage = (grade) => {
    setSelectedGrade(grade);
    setGradeSearchText("");
    setSelectedEntryId(null);
    setPage("grade");
    setErrorMessage("");
  };

  const openUploadPage = () => {
    setPage("upload");
    setUploadGrade(selectedGrade || 1);
    setStudentId("");
    setName("");
    setTopic("");
    setDescription("");
    setHashtags("");
    setFileObject(null);
    setCoverImageFile(null);
    setErrorMessage("");
    setTimeout(() => {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    }, 0);
  };

  const openDetailPage = (entry) => {
    setEntries((prev) =>
      prev.map((item) =>
        item.id === entry.id ? { ...item, views: Number(item.views || 0) + 1 } : item
      )
    );
    setSelectedEntryId(entry.id);
    setPage("detail");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFileObject(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (file && !file.type.startsWith("image/")) {
      setErrorMessage("표지사진 업로드에는 사진 파일만 넣을 수 있어요.");
      e.target.value = "";
      setCoverImageFile(null);
      return;
    }

    setErrorMessage("");
    setCoverImageFile(file);
  };

  const increaseLike = (entryId) => {
    setEntries((prev) =>
      prev.map((item) =>
        item.id === entryId ? { ...item, likes: Number(item.likes || 0) + 1 } : item
      )
    );
  };

  const canSubmit =
    uploadGrade &&
    studentId.trim() &&
    name.trim() &&
    topic.trim() &&
    fileObject &&
    coverImageFile;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setErrorMessage("학번, 이름, 탐구주제, 파일 업로드, 표지사진 업로드를 모두 완료해야 업로드할 수 있어요.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const [fileData, coverData] = await Promise.all([
        readFileAsDataURL(fileObject),
        readFileAsDataURL(coverImageFile),
      ]);

      const newEntry = normalizeEntry({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        grade: Number(uploadGrade),
        studentId: studentId.trim(),
        name: name.trim(),
        topic: topic.trim(),
        description: description.trim(),
        hashtags: hashtags.trim(),
        fileName: fileObject.name,
        fileType: fileObject.type || "application/octet-stream",
        fileData,
        coverData,
        createdAt: Date.now(),
        likes: 0,
        views: 0,
      });

      setEntries((prev) => [newEntry, ...prev]);
      setSelectedGrade(Number(uploadGrade));
      setGradeSearchText("");
      resetUploadForm();
      setPage("grade");
    } catch (e) {
      console.error(e);
      setErrorMessage("업로드 중 문제가 생겼어요. 파일이 너무 크면 브라우저 저장 공간 때문에 실패할 수 있어요.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderHome = () => (
    <div className="phone-shell">
      <div className="phone-inner">
        <div className="topbar">
          <div className="brand-group">
            <div className="brand-mark">A</div>
            <div>
              <div className="brand-title">Achievement Archive</div>
              <div className="brand-subtitle">탐구 · 실험 · 제작 기록 공유</div>
            </div>
          </div>
          <div className="grade-pill">OPEN</div>
        </div>

        <div className="headline-box">
          <h2>
            우리의 탐구를
            <br />기록하고 공유하는 공간
          </h2>
          <p>
            이름, 학번, 탐구주제로 자료를 빠르게 찾고 학년별 성과를 한곳에서 둘러볼 수 있도록 구성했습니다.
          </p>
        </div>

        <div className="search-wrap home-search">
          <span className="search-icon">⌕</span>
          <input
            value={homeSearchText}
            onChange={(e) => setHomeSearchText(e.target.value)}
            placeholder="이름 · 학번 · 탐구주제 검색"
          />
        </div>

        {homeSearchText.trim() && (
          <div className="home-result-list">
            {homeResults.length === 0 ? (
              <div className="empty-card">검색 결과가 없어요. 다른 이름, 학번, 탐구주제로 다시 찾아보세요.</div>
            ) : (
              homeResults.map((entry) => (
                <button
                  key={entry.id}
                  className="home-result-card"
                  onClick={() => openDetailPage(entry)}
                >
                  <img src={entry.coverData} alt={`${entry.name} 표지사진`} />
                  <div className="home-result-meta">
                    <div className="home-result-grade">{entry.grade}학년</div>
                    <div className="home-result-title">{entry.topic}</div>
                    <div className="home-result-name">{formatStudentLabel(entry)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        <button className="primary-button" onClick={openUploadPage}>
          업로드하기
        </button>

        <div className="section-card">
          <div className="section-label">Browse by Grade</div>

          <div className="grade-grid one">
            <button className="grade-button" onClick={() => openGradePage(1)}>
              1학년
            </button>
          </div>

          <div className="grade-grid two">
            <button className="grade-button" onClick={() => openGradePage(2)}>
              2학년
            </button>
            <button className="grade-button" onClick={() => openGradePage(3)}>
              3학년
            </button>
          </div>
        </div>

        <div className="home-note">
          3개월마다 우수 탐구를 투표로 선정해 1등, 2등, 3등 팀에게 소정의 상품을 제공하는 방식으로 참여와 공유를 더 활성화할 수 있습니다.
        </div>
      </div>
    </div>
  );

  const renderGrade = () => (
    <div className="phone-shell">
      <div className="phone-inner">
        <div className="topbar">
          <div className="brand-group">
            <div className="brand-mark">A</div>
            <div>
              <div className="brand-title">Achievement Archive</div>
              <div className="brand-subtitle">{selectedGrade}학년 아카이브</div>
            </div>
          </div>
          <button className="ghost-button" onClick={openUploadPage}>업로드</button>
        </div>

        <div className="page-header-row">
          <div>
            <div className="page-title">{selectedGrade}학년 자료 모음</div>
            <div className="page-subtitle">학년별로 자료를 구분해 볼 수 있고, 홈 화면에서는 학년 구분 없이 전체 검색도 가능합니다.</div>
          </div>
        </div>

        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            value={gradeSearchText}
            onChange={(e) => setGradeSearchText(e.target.value)}
            placeholder="이름 · 학번 · 탐구주제 · 설명 · 해시태그 검색"
          />
        </div>

        <div className="sort-row">
          <div className="result-count">정렬 방식</div>
          <select
            className="sort-select"
            value={currentSort}
            onChange={(e) =>
              setSortByGrade((prev) => ({
                ...prev,
                [selectedGrade]: e.target.value,
              }))
            }
          >
            <option value="latest">최신순</option>
            <option value="likes">인기순</option>
            <option value="views">조회순</option>
          </select>
        </div>

        <div className="grade-meta">
          <div className="result-count">총 {filteredEntries.length}개의 자료</div>
          <div className="grade-pill">Grade {selectedGrade}</div>
        </div>

        <div className="list-wrap">
          {filteredEntries.length === 0 ? (
            <div className="empty-card">
              아직 업로드된 자료가 없어요.
              <br />
              업로드 버튼을 눌러 첫 자료를 올려보세요.
            </div>
          ) : (
            <div className="entry-list">
              {filteredEntries.map((entry) => (
                <div className="entry-card" key={entry.id}>
                  <button
                    className="entry-thumb"
                    onClick={() => openDetailPage(entry)}
                    title="썸네일을 클릭하면 상세 화면으로 이동합니다"
                  >
                    <img src={entry.coverData} alt={`${entry.name} 표지사진`} />
                    <div className="entry-overlay">상세 보기</div>
                  </button>
                  <div className="entry-caption">
                    <strong>학번 · 이름 · 탐구주제</strong>
                    {formatStudentLabel(entry)} / {entry.topic}
                    {entry.description && (
                      <div className="entry-description-preview">{entry.description}</div>
                    )}
                    <div className="entry-stats">
                      <div className="stat-group">
                        <span>❤️ {entry.likes}</span>
                        <span>👁 {entry.views}</span>
                      </div>
                      <button className="like-button" onClick={() => increaseLike(entry.id)}>
                        ❤️ 좋아요
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="footer-actions">
          <button className="footer-button" onClick={goToHome}>뒤로가기</button>
          <button className="footer-button primary" onClick={openUploadPage}>업로드하기</button>
        </div>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="phone-shell">
      <div className="phone-inner">
        <div className="topbar">
          <div className="brand-group">
            <div className="brand-mark">A</div>
            <div>
              <div className="brand-title">Achievement Archive</div>
              <div className="brand-subtitle">자료 업로드</div>
            </div>
          </div>
          <div className="grade-pill">업로드</div>
        </div>

        <div className="headline-box">
          <h2>성과 자료 등록</h2>
          <p>학번, 이름, 탐구주제, 설명, 해시태그와 함께 파일 및 표지사진을 등록할 수 있습니다.</p>
        </div>

        <div className="field-group">
          <label className="field-label">학년 선택</label>
          <div className="grade-selector">
            {[1, 2, 3].map((grade) => (
              <button
                key={grade}
                type="button"
                className={`grade-toggle ${uploadGrade === grade ? "active" : ""}`}
                onClick={() => setUploadGrade(grade)}
              >
                {grade}학년
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">학번</label>
          <input
            className="field-input"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="학번을 입력하세요"
          />
        </div>

        <div className="field-group">
          <label className="field-label">이름</label>
          <input
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </div>

        <div className="field-group">
          <label className="field-label">탐구주제</label>
          <input
            className="field-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="탐구주제를 입력하세요"
          />
        </div>

        <div className="field-group">
          <label className="field-label">간단한 설명</label>
          <textarea
            className="field-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="탐구에 대한 간단한 설명을 입력하세요"
          />
        </div>

        <div className="field-group">
          <label className="field-label">해시태그</label>
          <input
            className="field-input"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#반도체 #물리 #자율탐구"
          />
        </div>

        <div className="upload-actions">
          <button className="upload-action" onClick={() => fileInputRef.current?.click()}>
            파일 업로드
          </button>
          <button className="upload-action" onClick={() => imageInputRef.current?.click()}>
            표지사진 업로드
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />

        <div className="upload-file-name">
          파일: {fileObject ? fileObject.name : "선택된 파일 없음"}
        </div>
        <div className="upload-file-name">
          표지사진: {coverImageFile ? coverImageFile.name : "선택된 표지사진 없음"}
        </div>

        {errorMessage && <div className="error-box">{errorMessage}</div>}

        <div className="footer-actions">
          <button
            className="footer-button"
            onClick={() => {
              if (selectedGrade) {
                setPage("grade");
              } else {
                goToHome();
              }
            }}
          >
            뒤로가기
          </button>
          <button className="footer-button primary" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "업로드 중" : "확인"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedEntry) return null;

    return (
      <div className="phone-shell">
        <div className="phone-inner">
          <div className="topbar">
            <div className="brand-group">
              <div className="brand-mark">A</div>
              <div>
                <div className="brand-title">Achievement Archive</div>
                <div className="brand-subtitle">상세 자료 보기</div>
              </div>
            </div>
            <div className="grade-pill">{selectedEntry.grade}학년</div>
          </div>

          <div className="detail-shell">
            <img className="detail-cover" src={selectedEntry.coverData} alt={`${selectedEntry.name} 표지사진`} />

            <div className="detail-card">
              <h2 className="detail-topic">{selectedEntry.topic}</h2>
              <div className="detail-meta">{formatStudentLabel(selectedEntry)} · 업로드 자료</div>
              <div className="detail-description">
                {selectedEntry.description || "등록된 설명이 없습니다."}
              </div>

              {parseTags(selectedEntry.hashtags).length > 0 && (
                <div className="tag-list">
                  {parseTags(selectedEntry.hashtags).map((tag) => (
                    <span key={tag} className="tag-chip">{tag}</span>
                  ))}
                </div>
              )}

              <div className="detail-stat-row">
                <div className="stat-group">
                  <span>❤️ {selectedEntry.likes}</span>
                  <span>👁 {selectedEntry.views}</span>
                </div>
                <button className="like-button" onClick={() => increaseLike(selectedEntry.id)}>
                  ❤️ 좋아요
                </button>
              </div>
            </div>

            <button
              className="download-button"
              onClick={() => downloadDataUrl(selectedEntry.fileData, selectedEntry.fileName)}
            >
              파일 다운로드
            </button>
          </div>

          <div className="footer-actions">
            <button className="footer-button" onClick={() => setPage("grade")}>뒤로가기</button>
            <button className="footer-button primary" onClick={openUploadPage}>업로드하기</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{css}</style>
      <div className="archive-page">
        <div className="archive-wrap">
          <div className="hero-copy">
            <div className="hero-kicker">KSHS RESEARCH ARCHIVE</div>
            <h1 className="hero-title">
              KSHS 연구 성과를
              <br />차곡차곡 모아 나누는 디지털 아카이브
            </h1>

            <div className="feature-list">
              <div className="feature-card">
                <strong>검색과 탐색</strong>
                <span>1학년, 2학년, 3학년 자료를 학년별로 구분해 볼 수 있고, 홈 화면에서는 학년 구분 없이 전체 자료를 검색할 수 있습니다.</span>
              </div>
              <div className="feature-card">
                <strong>상세 자료 보기</strong>
                <span>썸네일을 클릭하면 바로 다운로드되지 않고, 설명·해시태그·다운로드 버튼이 있는 상세 화면으로 이동합니다.</span>
              </div>
              <div className="feature-card">
                <strong>분기별 우수 탐구 투표</strong>
                <span>3개월마다 가장 인상적인 탐구를 투표로 선정하여 1등, 2등, 3등 팀에게 소정의 상품을 제공하는 이벤트로 확장할 수 있습니다.</span>
              </div>
            </div>
          </div>

          {page === "home" && renderHome()}
          {page === "grade" && renderGrade()}
          {page === "upload" && renderUpload()}
          {page === "detail" && renderDetail()}
        </div>
      </div>
    </>
  );
}
