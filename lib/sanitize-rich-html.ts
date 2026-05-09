import sanitizeHtml from "sanitize-html";

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  "img",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span",
  "div",
  "u",
  "s",
  "mark",
  "sub",
  "sup",
];

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    allowedClasses: {},
  });
}