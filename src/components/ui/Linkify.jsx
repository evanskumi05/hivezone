import React from 'react';

const Linkify = ({ text, className = "" }) => {
    if (!text) return null;

    // Enhanced URL regex to capture https, www, and raw domains like "example.com"
    // This regex looks for:
    // 1. Protocols (http/https)
    // 2. www. domains
    // 3. Raw domains (word.tld) that are at least 2 chars for TLD and preceded by space or start of line
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|(?:\b[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;
    
    // Split text by URLs and keep the URLs in the result array
    const parts = text.split(urlRegex);
    
    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part && part.match(urlRegex)) {
                    // Avoid false positives like "e.g." or "i.e." or "1.2"
                    const isFalsePositive = /^(e\.g\.|i\.e\.|[0-9]+\.[0-9]+)$/i.test(part);
                    if (isFalsePositive) return part;

                    const href = part.toLowerCase().startsWith('http') ? part : `https://${part}`;
                    return (
                        <a 
                            key={i} 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#ffc107] hover:underline break-all font-bold"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </a>
                    );
                }
                return part;
            })}
        </span>
    );
};

export default Linkify;
