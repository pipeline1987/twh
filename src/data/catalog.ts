import type { Author, Topic } from "../lib/types";

export const SITE = {
  name: "The Wizarding Herald",
  tagline: "Headlines delivered at maximum volume.",
  founded: 2006,
  price: "3 Knuts",
  place: "Hogwarts, Scotland",
};

export const AUTHORS: Author[] = [
  {
    name: "Rita Skeeter",
    slug: "rita-skeeter",
    title: "Chief Gossip Correspondent",
    bio: "Quick-Quotes Quill still warm. If a rumour can fly, Rita will give it a first-class owl and a second-class conscience.",
  },
  {
    name: "Augusta Howl",
    slug: "augusta-howl",
    title: "Howler Desk Editor",
    bio: "Believes news should arrive smoking. Runs the Herald's volume desk and personally tests every shouting charm.",
  },
  {
    name: "Gideon Fleet",
    slug: "gideon-fleet",
    title: "Quidditch Correspondent",
    bio: "Former reserve Beater for Puddlemere. Writes as if every paragraph might be hit by a Bludger.",
  },
  {
    name: "Elowen Proudfoot",
    slug: "elowen-proudfoot",
    title: "Hogsmeade Bureau Chief",
    bio: "Keeps a stool at the Three Broomsticks and a notebook that smells faintly of butterbeer.",
  },
  {
    name: "Caspian Thorne",
    slug: "caspian-thorne",
    title: "Ministry Correspondent",
    bio: "Reads decrees the way other people read tea leaves. Frequently locked out of the lift on Level Two.",
  },
  {
    name: "Pandora Nettle",
    slug: "pandora-nettle",
    title: "Magical Creatures Editor",
    bio: "Has been nipped by more species than she will admit. Files from the forest edge, never the path.",
  },
  {
    name: "Seraphina Moon",
    slug: "seraphina-moon",
    title: "Mysteries & Astronomy",
    bio: "Prefers stories that cannot be fully explained. Owns three telescopes and one unofficial prophecy.",
  },
  {
    name: "Minerva Quill",
    slug: "minerva-quill",
    title: "Education Editor",
    bio: "No relation to any Headmistress, though she answers the owl as if she were. Covers OWLs, NEWTs, and staircases.",
  },
  {
    name: "Beatrix Crowe",
    slug: "beatrix-crowe",
    title: "Investigations",
    bio: "Specializes in vanished memos, wobbling cups, and anything a Ministry clerk calls 'perfectly routine.'",
  },
  {
    name: "Lucian Pips",
    slug: "lucian-pips",
    title: "International Desk",
    bio: "Portkeys to the story. Speaks four languages and one that may be Gobbledegook after lunch.",
  },
  {
    name: "Tobias Inkwood",
    slug: "tobias-inkwood",
    title: "Features",
    bio: "Writes the long pieces: feasts, ghosts, and the quiet life of a castle that refuses to sit still.",
  },
];

export const TOPICS: Topic[] = [
  {
    name: "Hogwarts",
    slug: "hogwarts",
    kicker: "Castle",
    motif: "castle",
    blurb: "Staircases, feasts, and whatever the ceiling has decided to do today.",
  },
  {
    name: "Quidditch",
    slug: "quidditch",
    kicker: "Sport",
    motif: "quidditch",
    blurb: "Brooms, Bludgers, and the annual argument about the Snitch.",
  },
  {
    name: "Ministry",
    slug: "ministry",
    kicker: "Official",
    motif: "ministry",
    blurb: "Decrees, misspellings, and lifts that never stop on the useful floor.",
  },
  {
    name: "Creatures",
    slug: "creatures",
    kicker: "Beasts",
    motif: "forest",
    blurb: "From nifflers in the village to thestrals no one will admit they can see.",
  },
  {
    name: "Hogsmeade",
    slug: "hogsmeade",
    kicker: "Village",
    motif: "owl",
    blurb: "Weekend visits, shop bans, and the politics of butterbeer foam.",
  },
  {
    name: "Education",
    slug: "education",
    kicker: "Owls",
    motif: "crest",
    blurb: "Timetables, textbooks that bite, and the House Cup that will not sit still.",
  },
  {
    name: "International",
    slug: "international",
    kicker: "Abroad",
    motif: "star",
    blurb: "Exchange students, tournaments, and owls that arrive slightly jet-lagged.",
  },
  {
    name: "Society",
    slug: "society",
    kicker: "People",
    motif: "howler",
    blurb: "Balls, scandals, and who sat where at the High Table.",
  },
  {
    name: "Investigations",
    slug: "investigations",
    kicker: "Inquiry",
    motif: "potion",
    blurb: "When a goblet wobbles, we send Beatrix.",
  },
  {
    name: "Science",
    slug: "science",
    kicker: "Charms",
    motif: "potion",
    blurb: "Potions, charms research, and experiments the Board pretends not to fund.",
  },
];

export function authorBySlug(slug: string) {
  return AUTHORS.find((author) => author.slug === slug);
}

export function topicBySlug(slug: string) {
  return TOPICS.find((topic) => topic.slug === slug);
}
