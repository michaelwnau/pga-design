// Archive of pre-rendered prints shipped in public/gallery. The Python
// generators (scripts/) produce these; the studio reproduces the Hofmann ones
// live. Ordered studies first, then reference plates and the xerox collage.
export interface GalleryItem {
  file: string;
  title: string;
  kind: "study" | "reference" | "xerox";
  caption: string;
}

const STUDY_IDS = [
  "08569676",
  "18911059",
  "30273047",
  "30972623",
  "37997914",
  "40213094",
  "76553202",
  "79847423",
  "83570586",
  "92726146",
  "98250483",
  "99507349",
];

export const GALLERY: GalleryItem[] = [
  ...STUDY_IDS.map((id): GalleryItem => ({
    file: `pga-${id}.png`,
    title: `pga-${id}`,
    kind: "study",
    caption: "Hofmann study — id is the seed",
  })),
  {
    file: "chaotic-xerox.png",
    title: "chaotic xerox",
    kind: "xerox",
    caption: "Ray Gun / punk collage",
  },
  {
    file: "armin-hofmann-1.png",
    title: "hofmann ref 1",
    kind: "reference",
    caption: "Graphic Design Manual study",
  },
  {
    file: "armin-hofmann-2.png",
    title: "hofmann ref 2",
    kind: "reference",
    caption: "Graphic Design Manual study",
  },
  {
    file: "armin-hofmann-3.png",
    title: "hofmann ref 3",
    kind: "reference",
    caption: "Graphic Design Manual study",
  },
];
