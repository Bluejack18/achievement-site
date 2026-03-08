import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "grade_achievement_gallery_v2";
const LIKE_STORAGE_KEY = "grade_achievement_gallery_v2_liked_ids";

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

function formatStudentLabel(entry) {
  return `${entry.studentId} ${entry.name}/${entry.topic}`;
}

function parseHashtags(value) {
  if (!value) return [];
  const raw = value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^#/, "").replace(/\s+/g, ""));

  return Array.from(new Set(raw))
    .filter(Boolean)
    .slice(0, 12)
    .map((tag) => `#${tag}`);
}

function normalizeEntry(entry) {
  return {
    id: entry?.id || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    grade: Number(entry?.grade) || 1,
    studentId: entry?.studentId || "",
    name: entry?.name || "",
    topic: entry?.topic || "",
    description: entry?.description || "",
    hashtags: Array.isArray(entry?.hashtags) ? entry.hashtags : [],
    fileName: entry?.fileName || "",
    fileType: entry?.fileType || "application/octet-stream",
    fileDataUrl: entry?.fileDataUrl || "",
    coverImageName: entry?.coverImageName || "",
    coverImageDataUrl: entry?.coverImageDataUrl || "",
    createdAt: Number(entry?.createdAt) || Date.now(),
    likeCount: Number(entry?.likeCount) || 0,
    views: Number(entry?.views) || 0,
  };
}

function sortEntries(list, sortBy) {
  const copied = [...list];

  if (sortBy === "popular") {
    return copied.sort(
      (a, b) =>
        (b.likeCount || 0) - (a.likeCount || 0) ||
        (b.views || 0) - (a.views || 0) ||
        (b.createdAt || 0) - (a.createdAt || 0)
    );
  }

  if (sortBy === "views") {
    return copied.sort(
      (a, b) =>
        (b.views || 0) - (a.views || 0) ||
        (b.likeCount || 0) - (a.likeCount || 0) ||
        (b.createdAt || 0) - (a.createdAt || 0)
    );
  }

  return copied.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function formatDate(timestamp) {
  try {
    return new Date(timestamp).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
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

  button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .archive-page {
    min-height: 100vh;
    padding: 42px 16px 28px;
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
    padding-top: 26px;
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
    margin: 18px 0 12px;
    font-size: 40px;
    line-height: 1.14;
    letter-spacing: -0.04em;
    font-weight: 800;
    color: #1a2740;
  }

  .feature-list {
    display: grid;
    gap: 12px;
    margin-top: 24px;
  }

  .feature-card {
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(255,255,255,0.68);
    border: 1px solid rgba(31, 54, 92, 0.08);
    box-shadow: 0 12px 30px rgba(24, 35, 53, 0.06);
  }

  .feature-card strong {
    display: block;
    margin-bottom: 4px;
    color: #24324a;
    font-size: 14px;
  }

  .feature-card span {
    color: #667487;
    font-size: 13px;
    line-height: 1.7;
  }

  .phone-shell {
    width: 390px;
    min-height: 740px;
    border-radius: 34px;
    background: rgba(255,255,255,0.78);
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
  }

  .brand-group {
    display: flex;
    align-items: center;
    gap: 10px;
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
    min-width: 66px;
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

  .section-subtitle {
    margin-top: 4px;
    color: #6b7788;
    font-size: 13px;
    line-height: 1.7;
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
  .outline-button:hover,
  .entry-thumb:hover,
  .footer-button:hover,
  .grade-toggle:hover,
  .sort-toggle:hover,
  .stat-chip:hover {
    transform: translateY(-1px);
  }

  .grade-button:hover {
    border-color: rgba(47, 79, 132, 0.28);
    box-shadow: 0 16px 28px rgba(31, 54, 92, 0.1);
  }

  .home-note {
    margin-top: 18px;
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(255,255,255,0.76);
    border: 1px solid rgba(31, 54, 92, 0.08);
    color: #647284;
    font-size: 13px;
    line-height: 1.75;
  }

  .home-search-results {
    margin-bottom: 22px;
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
    line-height: 1.6;
  }

  .ghost-button,
  .outline-button,
  .footer-button,
  .upload-action,
  .grade-toggle,
  .sort-toggle,
  .stat-chip {
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

  .grade-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 16px 0 14px;
    flex-wrap: wrap;
  }

  .result-count {
    color: #728092;
    font-size: 13px;
    font-weight: 700;
  }

  .sort-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .sort-toggle {
    height: 44px;
    border-radius: 14px;
    border: 1px solid rgba(31, 54, 92, 0.1);
    background: rgba(255,255,255,0.88);
    color: #30425f;
    font-weight: 800;
    box-shadow: 0 8px 18px rgba(28, 40, 60, 0.05);
  }

  .sort-toggle.active {
    background: linear-gradient(135deg, #223962 0%, #315387 100%);
    color: white;
    border: none;
    box-shadow: 0 14px 24px rgba(35, 58, 99, 0.22);
  }

  .list-wrap {
    height: 560px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .list-wrap::-webkit-scrollbar,
  .detail-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .list-wrap::-webkit-scrollbar-thumb,
  .detail-scroll::-webkit-scrollbar-thumb {
    background: rgba(44, 64, 95, 0.18);
    border-radius: 999px;
  }

  .home-search-results .list-wrap {
    height: 380px;
  }

  .entry-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding-bottom: 14px;
  }

  .empty-card,
  .entry-card,
  .detail-card {
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
    height: 240px;
    border: none;
    border-radius: 18px;
    overflow: hidden;
    position: relative;
    padding: 0;
    display: block;
    background: #ece7df;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);
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
    padding: 14px 14px 12px;
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

  .entry-description {
    margin-top: 10px;
    color: #5f6c7e;
    font-size: 13px;
    line-height: 1.7;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .tag-chip {
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(35, 57, 98, 0.08);
    color: #314364;
    font-size: 12px;
    font-weight: 700;
  }

  .entry-actions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 14px 14px;
    flex-wrap: wrap;
  }

  .entry-actions-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .stat-chip {
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(31, 54, 92, 0.1);
    background: rgba(255,255,255,0.84);
    color: #32445f;
    font-size: 12px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 16px rgba(28, 40, 60, 0.05);
  }

  .stat-chip.like-active {
    background: rgba(219, 75, 102, 0.12);
    border-color: rgba(219, 75, 102, 0.18);
    color: #b33d56;
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

  .footer-button.like-active {
    background: rgba(219, 75, 102, 0.12);
    border-color: rgba(219, 75, 102, 0.18);
    color: #b33d56;
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

  .upload-info {
    margin-top: 16px;
    padding: 14px 15px;
    border-radius: 18px;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(31, 54, 92, 0.08);
    color: #69778b;
    font-size: 13px;
    line-height: 1.8;
  }

  .detail-scroll {
    height: 560px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .detail-card {
    overflow: hidden;
  }

  .detail-image-wrap {
    width: 100%;
    height: 260px;
    background: #e8e2d8;
  }

  .detail-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .detail-body {
    padding: 18px;
  }

  .detail-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(35, 57, 98, 0.08);
    color: #314364;
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 12px;
  }

  .detail-title {
    margin: 0;
    font-size: 24px;
    line-height: 1.3;
    color: #172338;
    letter-spacing: -0.03em;
  }

  .detail-author {
    margin-top: 8px;
    color: #6a7788;
    font-size: 14px;
    line-height: 1.7;
  }

  .detail-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 16px;
  }

  .detail-meta-item {
    padding: 12px 13px;
    border-radius: 16px;
    background: rgba(248,246,242,0.96);
    border: 1px solid rgba(31, 54, 92, 0.08);
  }

  .detail-meta-item strong {
    display: block;
    margin-bottom: 4px;
    color: #7a6b58;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.03em;
  }

  .detail-meta-item span {
    color: #22324d;
    font-size: 13px;
    line-height: 1.6;
    word-break: break-word;
  }

  .detail-description-box {
    margin-top: 18px;
    padding: 14px 15px;
    border-radius: 18px;
    background: rgba(248,246,242,0.96);
    border: 1px solid rgba(31, 54, 92, 0.08);
  }

  .detail-section-title {
    display: block;
    margin-bottom: 8px;
    color: #7a6b58;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.03em;
  }

  .detail-description-text {
    color: #41506a;
    font-size: 14px;
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-word;
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

    .detail-meta-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [detailSource, setDetailSource] = useState("home");

  const [entries, setEntries] = useState([]);
  const [likedEntryIds, setLikedEntryIds] = useState([]);

  const [homeSearchText, setHomeSearchText] = useState("");
  const [gradeSearchText, setGradeSearchText] = useState("");
  const [homeSortBy, setHomeSortBy] = useState("latest");
  const [gradeSortMap, setGradeSortMap] = useState({
    1: "latest",
    2: "latest",
    3: "latest",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const [uploadGrade, setUploadGrade] = useState(1);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [hashtagsText, setHashtagsText] = useState("");
  const [fileObject, setFileObject] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem(STORAGE_KEY);
      if (savedEntries) {
        const parsed = JSON.parse(savedEntries);
        if (Array.isArray(parsed)) {
          setEntries(parsed.map(normalizeEntry));
        }
      }
    } catch (e) {
      console.error("Failed to load saved entries", e);
    }

    try {
      const savedLikes = localStorage.getItem(LIKE_STORAGE_KEY);
      if (savedLikes) {
        const parsedLikes = JSON.parse(savedLikes);
        if (Array.isArray(parsedLikes)) {
          setLikedEntryIds(parsedLikes);
        }
      }
    } catch (e) {
      console.error("Failed to load liked entry ids", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error("Failed to save entries", e);
    }
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(likedEntryIds));
    } catch (e) {
      console.error("Failed to save liked ids", e);
    }
  }, [likedEntryIds]);

  const isLiked = (entryId) => likedEntryIds.includes(entryId);

  const selectedEntry = useMemo(() => {
    return entries.find((entry) => entry.id === selectedEntryId) || null;
  }, [entries, selectedEntryId]);

  const homeFilteredEntries = useMemo(() => {
    const keyword = homeSearchText.trim().toLowerCase();
    if (!keyword) return [];

    const filtered = entries.filter((entry) => {
      const haystack = [
        entry.grade,
        entry.studentId,
        entry.name,
        entry.topic,
        entry.description,
        ...(entry.hashtags || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });

    return sortEntries(filtered, homeSortBy);
  }, [entries, homeSearchText, homeSortBy]);

  const gradeFilteredEntries = useMemo(() => {
    if (!selectedGrade) return [];

    const keyword = gradeSearchText.trim().toLowerCase();
    const filtered = entries
      .filter((entry) => entry.grade === selectedGrade)
      .filter((entry) => {
        if (!keyword) return true;

        const haystack = [
          entry.studentId,
          entry.name,
          entry.topic,
          entry.description,
          ...(entry.hashtags || []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(keyword);
      });

    return sortEntries(filtered, gradeSortMap[selectedGrade] || "latest");
  }, [entries, selectedGrade, gradeSearchText, gradeSortMap]);

  const resetUploadForm = () => {
    setUploadGrade(selectedGrade || 1);
    setStudentId("");
    setName("");
    setTopic("");
    setDescription("");
    setHashtagsText("");
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
    setErrorMessage("");
  };

  const goBackFromDetail = () => {
    if (detailSource === "grade" && selectedGrade) {
      setPage("grade");
      return;
    }
    setPage("home");
  };

  const openGradePage = (grade) => {
    setSelectedGrade(grade);
    setGradeSearchText(homeSearchText.trim());
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
    setHashtagsText("");
    setFileObject(null);
    setCoverImageFile(null);
    setErrorMessage("");

    setTimeout(() => {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    }, 0);
  };

  const openDetailPage = (entryId, source) => {
    setDetailSource(source);
    setSelectedEntryId(entryId);
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? { ...entry, views: Number(entry.views || 0) + 1 }
          : entry
      )
    );
    setPage("detail");
  };

  const toggleLike = (entryId) => {
    const alreadyLiked = likedEntryIds.includes(entryId);

    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId) return entry;
        return {
          ...entry,
          likeCount: alreadyLiked
            ? Math.max(0, Number(entry.likeCount || 0) - 1)
            : Number(entry.likeCount || 0) + 1,
        };
      })
    );

    setLikedEntryIds((prev) =>
      alreadyLiked ? prev.filter((id) => id !== entryId) : [...prev, entryId]
    );
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

  const canSubmit =
    uploadGrade &&
    studentId.trim() &&
    name.trim() &&
    topic.trim() &&
    description.trim() &&
    fileObject &&
    coverImageFile;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setErrorMessage("학번, 이름, 탐구주제, 간단한 설명, 파일 업로드, 표지사진 업로드를 모두 완료해야 업로드할 수 있어요.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const [fileDataUrl, coverImageDataUrl] = await Promise.all([
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
        hashtags: parseHashtags(hashtagsText),
        fileName: fileObject.name,
        fileType: fileObject.type || "application/octet-stream",
        fileDataUrl,
        coverImageName: coverImageFile.name,
        coverImageDataUrl,
        createdAt: Date.now(),
        likeCount: 0,
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

  const renderSortButtons = (sortBy, onChange) => (
    <div className="sort-grid">
      <button
        type="button"
        className={`sort-toggle ${sortBy === "latest" ? "active" : ""}`}
        onClick={() => onChange("latest")}
      >
        최신순
      </button>
      <button
        type="button"
        className={`sort-toggle ${sortBy === "popular" ? "active" : ""}`}
        onClick={() => onChange("popular")}
      >
        인기순
      </button>
      <button
        type="button"
        className={`sort-toggle ${sortBy === "views" ? "active" : ""}`}
        onClick={() => onChange("views")}
      >
        조회순
      </button>
    </div>
  );

  const renderEntryCards = (list, source, showGrade = false) => (
    <div className="entry-list">
      {list.map((entry) => (
        <div className="entry-card" key={entry.id}>
          <button
            type="button"
            className="entry-thumb"
            onClick={() => openDetailPage(entry.id, source)}
            title="썸네일을 클릭하면 상세 화면으로 이동합니다"
          >
            <img src={entry.coverImageDataUrl} alt={`${entry.name} 표지사진`} />
            <div className="entry-overlay">상세 보기</div>
          </button>

          <div className="entry-caption">
            <strong>
              {showGrade
                ? "학년 · 학번 · 이름 · 탐구주제"
                : "학번 · 이름 · 탐구주제"}
            </strong>
            {showGrade
              ? `${entry.grade}학년 · ${formatStudentLabel(entry)}`
              : formatStudentLabel(entry)}

            {entry.description ? (
              <div className="entry-description">{entry.description}</div>
            ) : null}

            {entry.hashtags?.length ? (
              <div className="tag-row">
                {entry.hashtags.slice(0, 4).map((tag) => (
                  <span className="tag-chip" key={`${entry.id}_${tag}`}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="entry-actions-row">
            <button
              type="button"
              className={`stat-chip ${isLiked(entry.id) ? "like-active" : ""}`}
              onClick={() => toggleLike(entry.id)}
            >
              ♥ {entry.likeCount}
            </button>

            <div className="entry-actions-right">
              {showGrade ? <div className="stat-chip">{entry.grade}학년</div> : null}
              <div className="stat-chip">조회 {entry.views}</div>
              <div className="stat-chip">{formatDate(entry.createdAt)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

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
            KSHS의 탐구 기록을
            <br />
            한곳에 모아보는 아카이브
          </h2>
          <p>
            학년별 자료를 정리해서 보고, 홈 화면에서는 1학년부터 3학년까지
            전체 자료를 통합 검색할 수 있도록 구성했습니다.
          </p>
        </div>

        <div className="search-wrap home-search">
          <span className="search-icon">⌕</span>
          <input
            value={homeSearchText}
            onChange={(e) => setHomeSearchText(e.target.value)}
            placeholder="이름 · 학번 · 탐구주제 · 해시태그 검색"
          />
        </div>

        {homeSearchText.trim() ? (
          <div className="section-card home-search-results">
            <div className="page-header-row">
              <div>
                <div className="page-title">통합 검색 결과</div>
                <div className="page-subtitle">
                  홈 화면에서는 1학년, 2학년, 3학년 자료를 구분 없이 모두 보여줍니다.
                </div>
              </div>
            </div>

            <div className="grade-meta">
              <div className="result-count">총 {homeFilteredEntries.length}개의 자료</div>
            </div>

            {renderSortButtons(homeSortBy, setHomeSortBy)}

            <div className="list-wrap">
              {homeFilteredEntries.length === 0 ? (
                <div className="empty-card">
                  검색 결과가 없어요.
                  <br />
                  이름, 학번, 탐구주제, 설명, 해시태그로 다시 찾아보세요.
                </div>
              ) : (
                renderEntryCards(homeFilteredEntries, "home", true)
              )}
            </div>
          </div>
        ) : null}

        <button className="primary-button" onClick={openUploadPage}>
          업로드하기
        </button>

        <div className="section-card">
          <div className="section-label">Browse by Grade</div>
          <div className="section-subtitle">
            학년별로 자료를 나눠 보고, 각 학년 페이지에서는 원하는 정렬순으로 확인할 수 있습니다.
          </div>

          <div style={{ marginTop: 14 }}>
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
        </div>

        <div className="home-note">
          썸네일을 누르면 상세 화면으로 이동하며, 그곳에서 설명·해시태그·좋아요·조회수·파일 다운로드를 확인할 수 있습니다.
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
          <button className="ghost-button" onClick={openUploadPage}>
            업로드
          </button>
        </div>

        <div className="page-header-row">
          <div>
            <div className="page-title">{selectedGrade}학년 자료 모음</div>
            <div className="page-subtitle">
              해당 학년 자료만 검색 결과에 표시됩니다.
            </div>
          </div>
        </div>

        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            value={gradeSearchText}
            onChange={(e) => setGradeSearchText(e.target.value)}
            placeholder="이름 · 학번 · 탐구주제 · 해시태그 검색"
          />
        </div>

        <div className="grade-meta">
          <div className="result-count">총 {gradeFilteredEntries.length}개의 자료</div>
          <div className="grade-pill">Grade {selectedGrade}</div>
        </div>

        {renderSortButtons(
          gradeSortMap[selectedGrade] || "latest",
          (value) =>
            setGradeSortMap((prev) => ({
              ...prev,
              [selectedGrade]: value,
            }))
        )}

        <div className="list-wrap">
          {gradeFilteredEntries.length === 0 ? (
            <div className="empty-card">
              아직 업로드된 자료가 없어요.
              <br />
              업로드 버튼을 눌러 첫 자료를 올려보세요.
            </div>
          ) : (
            renderEntryCards(gradeFilteredEntries, "grade")
          )}
        </div>

        <div className="footer-actions">
          <button className="footer-button" onClick={goToHome}>
            뒤로가기
          </button>
          <button className="footer-button primary" onClick={openUploadPage}>
            업로드하기
          </button>
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
          <p>
            학번, 이름, 탐구주제, 간단한 설명, 파일, 표지사진을 모두 입력하면
            목록 화면에 바로 반영됩니다.
          </p>
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
          <textarea
            className="field-textarea"
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
            placeholder="탐구 내용을 짧게 소개해주세요"
          />
        </div>

        <div className="field-group">
          <label className="field-label">해시태그</label>
          <input
            className="field-input"
            value={hashtagsText}
            onChange={(e) => setHashtagsText(e.target.value)}
            placeholder="#물리, #반도체, #자율탐구 처럼 입력하세요"
          />
        </div>

        <div className="upload-actions">
          <button
            className="upload-action"
            onClick={() => fileInputRef.current?.click()}
          >
            파일 업로드
          </button>
          <button
            className="upload-action"
            onClick={() => imageInputRef.current?.click()}
          >
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

        {errorMessage ? <div className="error-box">{errorMessage}</div> : null}

        <div className="upload-info">
          등록 후에는 선택한 학년 목록과 홈 화면 통합 검색에서 모두 확인할 수 있습니다.
          썸네일을 누르면 상세 화면으로 이동하며, 그곳에서 다운로드와 좋아요를 사용할 수 있습니다.
        </div>

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
    if (!selectedEntry) {
      return (
        <div className="phone-shell">
          <div className="phone-inner">
            <div className="empty-card">
              선택한 자료를 찾을 수 없어요.
              <br />
              목록으로 돌아가 다시 선택해주세요.
            </div>
            <div className="footer-actions">
              <button className="footer-button primary" onClick={goBackFromDetail}>
                돌아가기
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="phone-shell">
        <div className="phone-inner">
          <div className="topbar">
            <div className="brand-group">
              <div className="brand-mark">A</div>
              <div>
                <div className="brand-title">Achievement Archive</div>
                <div className="brand-subtitle">상세 보기</div>
              </div>
            </div>
            <div className="grade-pill">상세</div>
          </div>

          <div className="page-header-row">
            <div>
              <div className="page-title">탐구 상세 정보</div>
              <div className="page-subtitle">
                자료 설명, 해시태그, 좋아요, 조회수, 다운로드를 확인할 수 있습니다.
              </div>
            </div>
          </div>

          <div className="detail-scroll">
            <div className="detail-card">
              <div className="detail-image-wrap">
                <img
                  className="detail-image"
                  src={selectedEntry.coverImageDataUrl}
                  alt={`${selectedEntry.name} 표지사진`}
                />
              </div>

              <div className="detail-body">
                <div className="detail-kicker">{selectedEntry.grade}학년 자료</div>

                <h3 className="detail-title">{selectedEntry.topic}</h3>
                <div className="detail-author">
                  {selectedEntry.studentId} · {selectedEntry.name}
                </div>

                <div className="detail-meta-grid">
                  <div className="detail-meta-item">
                    <strong>등록일</strong>
                    <span>{formatDate(selectedEntry.createdAt)}</span>
                  </div>
                  <div className="detail-meta-item">
                    <strong>파일명</strong>
                    <span>{selectedEntry.fileName}</span>
                  </div>
                  <div className="detail-meta-item">
                    <strong>좋아요</strong>
                    <span>{selectedEntry.likeCount}개</span>
                  </div>
                  <div className="detail-meta-item">
                    <strong>조회수</strong>
                    <span>{selectedEntry.views}회</span>
                  </div>
                </div>

                <div className="detail-description-box">
                  <span className="detail-section-title">간단한 설명</span>
                  <div className="detail-description-text">
                    {selectedEntry.description || "등록된 설명이 없습니다."}
                  </div>
                </div>

                {selectedEntry.hashtags?.length ? (
                  <div className="detail-description-box">
                    <span className="detail-section-title">해시태그</span>
                    <div className="tag-row">
                      {selectedEntry.hashtags.map((tag) => (
                        <span className="tag-chip" key={`${selectedEntry.id}_${tag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="footer-actions">
            <button className="footer-button" onClick={goBackFromDetail}>
              뒤로가기
            </button>
            <button
              className={`footer-button ${isLiked(selectedEntry.id) ? "like-active" : ""}`}
              onClick={() => toggleLike(selectedEntry.id)}
            >
              ♥ {selectedEntry.likeCount}
            </button>
            <button
              className="footer-button primary"
              onClick={() =>
                downloadDataUrl(selectedEntry.fileDataUrl, selectedEntry.fileName)
              }
            >
              파일 다운로드
            </button>
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
              강원과학고의 탐구 결과를
              <br />
              한눈에 모아보는 연구 아카이브
            </h1>

            <div className="feature-list">
              <div className="feature-card">
                <strong>학년별 탐색 + 홈 통합 검색</strong>
                <span>
                  1학년, 2학년, 3학년 자료를 각각 나눠서 볼 수 있고, 홈 화면에서는
                  학년 구분 없이 전체 자료를 한 번에 검색할 수 있습니다.
                </span>
              </div>

              <div className="feature-card">
                <strong>상세 화면 중심 탐색</strong>
                <span>
                  목록의 썸네일을 누르면 상세 화면으로 이동하며, 그곳에서 설명과 해시태그를 확인하고 파일을 다운로드할 수 있습니다.
                </span>
              </div>

              <div className="feature-card">
                <strong>분기별 우수 탐구 투표</strong>
                <span>
                  3개월에 한 번 투표를 통해 가장 인상적인 탐구를 선정하고, 1등·2등·3등에게 상품을 제공하는 운영 방식까지 자연스럽게 확장할 수 있습니다.
                </span>
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