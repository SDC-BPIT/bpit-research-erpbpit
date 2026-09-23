function extractDoiFromString(str) {
  if (!str) return null;
  const match = str.match(/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
  return match ? match[1] : null;
}

function findDoiInHtml(html) {
  const metaMatch = html.match(/<meta\s+name=["']citation_doi["']\s+content=["'](10\.\d{4,9}\/[^"']+)["']/i) ||
                    html.match(/<meta\s+content=["'](10\.\d{4,9}\/[^"']+)["']\s+name=["']citation_doi["']/i) ||
                    html.match(/<meta\s+property=["']og:doi["']\s+content=["'](10\.\d{4,9}\/[^"']+)["']/i) ||
                    html.match(/<meta\s+name=["']dc\.identifier["']\s+content=["'](?:doi:)?(10\.\d{4,9}\/[^"']+)["']/i);
  if (metaMatch) return metaMatch[1];

  const linkMatch = html.match(/(?:doi\.org\/)(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
  if (linkMatch) return linkMatch[1];

  const jsonMatch = html.match(/["']doi["']\s*:\s*["'](10\.\d{4,9}\/[^"']+)["']/i);
  if (jsonMatch) return jsonMatch[1];

  const fallbackMatch = html.match(/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
  if (fallbackMatch) return fallbackMatch[1];

  return null;
}

function parsePatentHtml(html) {
  const result = {
    title: "",
    inventors: [],
    assignees: [],
    applicationNo: "",
    patentNo: "",
    filingDate: "",
    publicationDate: "",
    grantDate: "",
    status: "Published",
    country: "United States"
  };

  const titleMatch = html.match(/<meta\s+name=["']DC\.title["']\s+content=["']([^"']+)["']/i);
  if (titleMatch) {
    result.title = titleMatch[1].replace(/\s+/g, " ").trim();
  }

  const appNoMatch = html.match(/<meta\s+name=["']citation_patent_application_number["']\s+content=["']([^"']+)["']/i);
  if (appNoMatch) {
    result.applicationNo = appNoMatch[1].trim();
  }

  const patNoMatch = html.match(/<meta\s+name=["']citation_patent_number["']\s+content=["']([^"']+)["']/i);
  if (patNoMatch) {
    const rawPat = patNoMatch[1].trim();
    result.patentNo = rawPat.split(":").pop().trim();
    const parts = rawPat.split(":");
    if (parts.length > 0) {
      const countryCode = parts[0].trim().toUpperCase();
      if (countryCode === "US") result.country = "United States";
      else if (countryCode === "IN") result.country = "India";
      else result.country = countryCode;
    }
  }

  // Extract kindCode and description to determine status (Granted vs Published)
  const kindCodeMatch = html.match(/<meta\s+itemprop=["']kindCode["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+itemprop=["']kindCode["']/i);
  const kindCode = kindCodeMatch ? kindCodeMatch[1].trim() : "";

  const descMatch = html.match(/<meta\s+itemprop=["']publicationDescription["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+itemprop=["']publicationDescription["']/i);
  const desc = descMatch ? descMatch[1].trim() : "";

  let isGranted = false;
  if (desc) {
    if (desc.toLowerCase().includes("patent") && !desc.toLowerCase().includes("application")) {
      isGranted = true;
    }
  } else if (kindCode) {
    const code = kindCode.toUpperCase();
    if (code.startsWith("B") || code.startsWith("C") || code.startsWith("P") || code.startsWith("S")) {
      isGranted = true;
    }
  }

  let issueDate = "";
  let match;
  const metaRegex = /<meta\s+([^>]+)>/gi;
  while ((match = metaRegex.exec(html)) !== null) {
    const attrs = match[1];
    const isDcDate = /\bname=["']DC\.date["']/i.test(attrs);
    if (isDcDate) {
      const contentMatch = attrs.match(/\bcontent=["']([^"']+)["']/i);
      const schemeMatch = attrs.match(/\bscheme=["']([^"']+)["']/i);
      if (contentMatch) {
        const dateVal = contentMatch[1].trim();
        const schemeVal = schemeMatch ? schemeMatch[1].trim() : "";
        if (schemeVal === "dateSubmitted") {
          result.filingDate = dateVal;
        } else if (schemeVal === "issue" || !schemeVal) {
          issueDate = dateVal;
        }
      }
    }
  }

  if (issueDate) {
    if (isGranted) {
      result.status = "Granted";
      result.grantDate = issueDate;
      result.publicationDate = issueDate;
    } else {
      result.status = "Published";
      result.publicationDate = issueDate;
      result.grantDate = "";
      result.patentNo = ""; // No patent number for unpublished applications
    }
  }

  const contributorRegex = /<meta\s+name=["']DC\.contributor["']\s+content=["']([^"']+)["']\s+scheme=["']([^"']+)["']/gi;
  while ((match = contributorRegex.exec(html)) !== null) {
    const nameVal = match[1].trim();
    const schemeVal = match[2].trim();
    if (schemeVal === "inventor") {
      result.inventors.push(nameVal);
    } else if (schemeVal === "assignee") {
      result.assignees.push(nameVal);
    }
  }

  const contributorRegexAlt = /<meta\s+name=["']DC\.contributor["']\s+scheme=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
  while ((match = contributorRegexAlt.exec(html)) !== null) {
    const schemeVal = match[1].trim();
    const nameVal = match[2].trim();
    if (schemeVal === "inventor") {
      result.inventors.push(nameVal);
    } else if (schemeVal === "assignee") {
      result.assignees.push(nameVal);
    }
  }

  result.inventors = result.inventors.join(", ");
  result.assignees = result.assignees.join(", ");

  return result;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { doi } = req.query;
  if (!doi) {
    return res.status(400).json({ error: 'DOI, Patent Number, or URL query parameter is required' });
  }

  doi = doi.trim();

  // Patent Detection and Resolving
  const isPatentUrl = doi.includes("patents.google.com");
  const isPatentNo = /^[A-Z]{2}\d+/i.test(doi) && !doi.includes("/") && !doi.includes(".");

  if (isPatentUrl || isPatentNo) {
    try {
      const patentId = isPatentUrl ? (doi.match(/patent\/([A-Z0-9]+)/i)?.[1] || "") : doi;
      if (patentId) {
        const pageUrl = `https://patents.google.com/patent/${encodeURIComponent(patentId)}/en`;
        const pageRes = await fetch(pageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const patentData = parsePatentHtml(html);
          return res.json({ isPatent: true, patent: patentData });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch patent data:", err.message);
    }
  }

  doi = doi.trim();

  let cleanDoi = null;
  if (doi.startsWith("http://") || doi.startsWith("https://") || (doi.includes(".") && doi.includes("/"))) {
    cleanDoi = extractDoiFromString(doi);
    if (!cleanDoi) {
      try {
        const pageUrl = doi.startsWith("http") ? doi : "https://" + doi;
        const pageRes = await fetch(pageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          cleanDoi = findDoiInHtml(html);
        }
      } catch (err) {
        console.warn("Failed to scrape webpage HTML:", err.message);
      }
    }
  } else {
    cleanDoi = extractDoiFromString(doi) || doi;
  }

  if (!cleanDoi) {
    return res.status(400).json({ error: 'Could not extract a valid DOI from the provided URL or text.' });
  }

  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Research-ERP-Agent/1.0 (mailto:admin@bpitindia.com)'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'DOI not found in CrossRef registry' });
      }
      return res.status(response.status).json({ error: `CrossRef API returned status ${response.status}` });
    }

    const data = await response.json();

    // Wikidata Lookup for Indexing (Scopus, SCI/SCIE, ESCI)
    let indexing = {
      scopus: "No",
      sciScie: "No",
      esci: "No"
    };

    const message = data.message;
    if (message && Array.isArray(message.ISSN) && message.ISSN.length > 0) {
      try {
        const issns = [];
        message.ISSN.forEach(function (issn) {
          const clean = issn.trim();
          if (clean) {
            issns.push(clean);
            if (clean.includes("-")) {
              issns.push(clean.replace("-", ""));
            } else if (clean.length === 8) {
              issns.push(clean.substring(0, 4) + "-" + clean.substring(4));
            }
          }
        });

        const issnFilter = Array.from(new Set(issns)).map(function (issn) { return `"${issn}"`; }).join(" ");
        const sparql = `
          SELECT ?index WHERE {
            VALUES ?issn { ${issnFilter} }
            ?journal wdt:P236 ?issn .
            ?journal p:P8875 ?statement .
            ?statement ps:P8875 ?index .
          }
        `;
        const queryUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
        const wikidataRes = await fetch(queryUrl, {
          headers: {
            "User-Agent": "Research-ERP-Agent/1.0 (mailto:admin@bpitindia.com)"
          }
        });
        if (wikidataRes.ok) {
          const wdata = await wikidataRes.json();
          if (wdata.results && wdata.results.bindings) {
            wdata.results.bindings.forEach(function (b) {
              const qid = b.index.value.split("/").pop();
              if (qid === "Q371467") {
                indexing.scopus = "Yes";
              }
              if (qid === "Q104047209" || qid === "Q110552280") {
                indexing.sciScie = "Yes";
              }
              if (qid === "Q27189445") {
                indexing.esci = "Yes";
              }
            });
          }
        }
      } catch (err) {
        console.warn("Wikidata query failed:", err.message);
      }
    }

    data.indexing = indexing;
    return res.json(data);
  } catch (err) {
    console.error('Backend DOI fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch DOI metadata from server: ' + err.message });
  }
};
