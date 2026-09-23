/**
 * Editable content lives in sites/music/content/*.json, which is what the CMS
 * at /admin writes. This module reads those files and checks them, reporting
 * mistakes by field name so a bad edit fails the build with a readable message
 * instead of shipping a broken page.
 */
import siteJson from "../../content/site.json";
import releasesJson from "../../content/releases.json";

export type Release = {
  title: string; year: number; type: string;
  spotify: string; apple?: string; amazon?: string; deezer?: string;
  /** Spotify album id, derived from the Spotify URL; keys the pixel cover. */
  id: string;
};
export type Link = { label: string; url: string; show: boolean };
export type Site = { tagline: string; bio: string; latestLabel: string; connect: Link[]; footerNote: string };

function fail(file: string, problems: string[]): never {
  throw new Error(["", `PROBLEM IN sites/music/content/${file}`, "", ...problems.map((p) => `  • ${p}`), ""].join("\n"));
}
const isUrl = (s: unknown) => typeof s === "string" && /^https:\/\/\S+$/.test(s);
const text = (s: unknown) => typeof s === "string" && s.trim().length > 0;

export function loadSite(): Site {
  const s = siteJson as any, p: string[] = [];
  for (const k of ["tagline", "bio", "latestLabel", "footerNote"]) if (!text(s[k])) p.push(`${k} can't be empty`);
  if (!Array.isArray(s.connect)) p.push("connect must be a list of links");
  else s.connect.forEach((l: any, i: number) => {
    const name = l?.label ? `"${l.label}"` : `link ${i + 1}`;
    if (!text(l?.label)) p.push(`${name}: label can't be empty`);
    if (l?.show && !isUrl(l?.url)) p.push(`${name}: is shown, so it needs a full URL starting with https://`);
  });
  if (p.length) fail("site.json", p);
  return { ...s, connect: s.connect.map((l: any) => ({ label: l.label, url: l.url ?? "", show: !!l.show })) };
}

export function loadReleases(): Release[] {
  const list = (releasesJson as any).releases, p: string[] = [];
  if (!Array.isArray(list) || !list.length) fail("releases.json", ["releases must be a list with at least one release"]);
  const out = list.map((r: any, i: number) => {
    const name = r?.title ? `"${r.title}"` : `release ${i + 1}`;
    if (!text(r?.title)) p.push(`${name}: title can't be empty`);
    if (!Number.isInteger(Number(r?.year))) p.push(`${name}: year must be a number like 2021`);
    if (!text(r?.type)) p.push(`${name}: type can't be empty (e.g. Single, EP · 6 tracks)`);
    const m = typeof r?.spotify === "string" && r.spotify.match(/open\.spotify\.com\/album\/([A-Za-z0-9]+)/);
    if (!m) p.push(`${name}: spotify must be a Spotify album link (https://open.spotify.com/album/...)`);
    for (const k of ["apple", "amazon", "deezer"]) if (r?.[k] && !isUrl(r[k])) p.push(`${name}: ${k} must be a full URL starting with https://, or left empty`);
    return { title: r?.title, year: Number(r?.year), type: r?.type, spotify: r?.spotify, apple: r?.apple || "", amazon: r?.amazon || "", deezer: r?.deezer || "", id: m ? m[1] : "" };
  });
  if (p.length) fail("releases.json", p);
  return out;
}
