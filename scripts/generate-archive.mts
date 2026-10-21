import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AUTHORS, TOPICS } from "../src/data/catalog.ts";
import type { Article, Motif } from "../src/lib/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const START_YEAR = 2006;
const END_YEAR = 2026;
const END_DATE = "2026-10-20";

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const HOUSES = ["Gryffindor", "Hufflepuff", "Ravenclaw", "Slytherin"] as const;
const RIVALS: Record<(typeof HOUSES)[number], (typeof HOUSES)[number]> = {
  Gryffindor: "Slytherin",
  Slytherin: "Gryffindor",
  Hufflepuff: "Ravenclaw",
  Ravenclaw: "Hufflepuff",
};
const STUDENTS = [
  "Otis Bramble",
  "Cressida Pike",
  "Jonah Flint",
  "Mira Thistle",
  "Alaric Pease",
  "Nell Vane",
  "Percy-not-that-one Hobbs",
  "Saffron Quinn",
  "Bram Oakley",
  "Isolde Crowe",
  "Felix Pennyworth",
  "Tamsin Rook",
];
const PROFESSORS = [
  "Professor Bramble",
  "Professor Nightshade",
  "Professor Kedgeree",
  "Professor Vale",
  "Professor Amberly",
  "Professor Quince",
];
const CREATURES = [
  "a niffler",
  "a thestral",
  "a hippogriff",
  "a bowtruckle",
  "a grindylow",
  "a kneazle",
  "a phoenix chick",
  "an overambitious puffskein",
];
const PLACES = [
  "the Great Hall",
  "the Astronomy Tower",
  "the Black Lake",
  "the Forbidden Forest",
  "the Quidditch pitch",
  "the Room of Requirement",
  "Honeydukes",
  "the Three Broomsticks",
  "the Owlery",
  "the dungeons",
  "the moving staircases",
  "Hogsmeade Station",
];

type Context = {
  year: number;
  house: (typeof HOUSES)[number];
  rival: (typeof HOUSES)[number];
  student: string;
  professor: string;
  creature: string;
  place: string;
};

type Draft = {
  title: string;
  dek: string;
  body: string[];
  authorSlug: string;
  topicSlug: string;
  featured?: boolean;
};

function ctx(rng: Rng, year: number): Context {
  const house = pick(rng, HOUSES);
  return {
    year,
    house,
    rival: RIVALS[house],
    student: pick(rng, STUDENTS),
    professor: pick(rng, PROFESSORS),
    creature: pick(rng, CREATURES),
    place: pick(rng, PLACES),
  };
}

function pretty(value: string) {
  return value
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase())
    .replace(/\bA\b/g, "a")
    .replace(/\bAn\b/g, "an")
    .replace(/\bThe\b/g, "the")
    .replace(/\bOf\b/g, "of");
}

function fill(template: string, c: Context, titled = false) {
  const creature = titled ? pretty(c.creature) : c.creature;
  const place = titled ? pretty(c.place) : c.place;
  return template
    .replaceAll("{year}", String(c.year))
    .replaceAll("{house}", c.house)
    .replaceAll("{rival}", c.rival)
    .replaceAll("{student}", c.student)
    .replaceAll("{professor}", c.professor)
    .replaceAll("{creature}", creature)
    .replaceAll("{place}", place);
}

const DESKS: {
  topicSlug: string;
  authorSlugs: string[];
  stories: {
    title: string;
    dek: string;
    body: string[];
  }[];
}[] = [
  {
    topicSlug: "quidditch",
    authorSlugs: ["gideon-fleet", "rita-skeeter"],
    stories: [
      {
        title: "{house} Practice Halted After Bludger Develops Opinions",
        dek: "A rogue Bludger spent forty minutes arguing with the {rival} Beaters before vanishing into {place}.",
        body: [
          "Inter-house practice over {place} was suspended on Tuesday after a Bludger refused, in the words of Captain {student}, 'to be hit in any direction that was not dramatically interesting.'",
          "{professor} inspected the ball and reported that someone had applied a commentary charm last updated in {year}. The charm offered live notes on every swing and rated the {house} Chasers 'try-hard.'",
          "The Department of Magical Games has asked for the Bludger to be sent to London. It left a forwarding owl.",
        ],
      },
      {
        title: "Snitch Hides in {place} Until After Curfew",
        dek: "{house} seekers say the match was technically still on. The groundskeeper disagrees.",
        body: [
          "Saturday's friendly between {house} and {rival} ended in a draw after the Golden Snitch tucked itself behind a tapestry near {place} and went to sleep.",
          "Seeker {student} produced a signed statement from a nearby suit of armour. The armour later withdrew the statement, citing 'union rules about evenings.'",
          "Gideon Fleet rates the match two brooms out of five, plus one extra broom for commitment.",
        ],
      },
      {
        title: "{house} Demands Recount After House Cup Goblet Wobbles",
        dek: "A single wobble, {rival} insists, is not a recount. {house} has filed three owls and a diagram.",
        body: [
          "The House Cup goblet, which has stood in {place} since the castle was last persuaded to hold still, developed a wobble visible from the High Table.",
          "{student} of {house} claims the wobble occurred 'in a {house}-ward direction' and should be scored. {rival} prefects called the theory 'geometry dressed as sport.'",
          "{professor} measured the wobble with a charmed ruler. The ruler also wobbled. The matter has been tabled until next term.",
        ],
      },
      {
        title: "New Broom Trials Leave {place} Briefly Airborne",
        dek: "A manufacturer demonstration in {year} went well, then went up.",
        body: [
          "A visiting broom merchant demonstrated a 'whisper-quiet' model over {place}. It was not whisper-quiet. Several first-years reported their hats left without them.",
          "{student} completed three circuits before the braking charm remembered its job. {professor} called the landing 'educational.'",
          "The merchant has offered Hogwarts a discount and a very long waiver.",
        ],
      },
    ],
  },
  {
    topicSlug: "hogwarts",
    authorSlugs: ["tobias-inkwood", "augusta-howl"],
    stories: [
      {
        title: "Moving Staircases Audit Finds Stairs That Prefer {place}",
        dek: "Three landings now commute. The castle, as usual, declined to comment.",
        body: [
          "A Board of Governors audit in {year} found that two staircases have been skipping the Charms corridor in favour of a scenic route past {place}.",
          "{student} was late to breakfast four days running and has requested a season ticket. {professor} suggested walking as a form of extra credit.",
          "The castle rearranged a portrait overnight. The new portrait is of a staircase. It looks smug.",
        ],
      },
      {
        title: "Enchanted Ceiling Over {place} Forecasts Howlers",
        dek: "Students now check the sky for both rain and incoming volume.",
        body: [
          "The ceiling above {place} began displaying a new weather band this week: a crimson ribbon labelled HOWLER RISK.",
          "{student} said the ribbon turned scarlet whenever someone mentioned exams. {professor} called the correlation 'statistically rude.'",
          "The Herald recommends hats, ear-muffs, and a sense of humour.",
        ],
      },
      {
        title: "House-Elves Vote on Pudding Policy After Cauldron Incident",
        dek: "The {year} pudding referendum was closer than the House Cup.",
        body: [
          "Kitchen staff called a snap vote after a cauldron of treacle tart developed ambitions and briefly occupied {place}.",
          "{student} described the tart as 'aggressive but fair.' {professor} confiscated spoons until further notice.",
          "The elves have adopted a three-pudding maximum. Several ghosts have already filed a minority report.",
        ],
      },
      {
        title: "Suit of Armour in {place} Starts Unofficial Advice Column",
        dek: "The armour is anonymous. The handwriting is not.",
        body: [
          "Notes signed 'A Friend in Steel' have appeared beside {place}, offering counsel on homework, hexes, and whether {house} should sit nearer the potatoes.",
          "{student} swears the advice saved a Transfiguration essay. {professor} swears the advice cited last year's exam.",
          "The Herald will not name the armour. It asked us not to. Very politely. With a sword.",
        ],
      },
    ],
  },
  {
    topicSlug: "ministry",
    authorSlugs: ["caspian-thorne", "beatrix-crowe"],
    stories: [
      {
        title: "Ministry Owl Delivers 200 Howlers to the Wrong Tower",
        dek: "A gale over the Black Lake turned official post into a public concert.",
        body: [
          "A Ministry dispatch owl lost its satchel over {place} on Thursday. Two hundred Howlers opened themselves in mid-air and read decrees to the lake.",
          "{student} transcribed the loudest one, which concerned cauldron thickness. {professor} said the lake now knows more regulation than most seventh-years.",
          "The Ministry has promised an inquiry and a quieter font.",
        ],
      },
      {
        title: "Decree {year}-B Bans Hovering Signage, Then Hovers",
        dek: "The notice spent six hours arguing with itself above {place}.",
        body: [
          "Educational Decree {year}-B arrived already enchanted to float. It forbids floating notices. The irony was audible.",
          "{student} asked a prefect which rule to follow. The prefect pointed at the decree, which spun slowly and hummed the national anthem of a country that does not exist.",
          "Caspian Thorne rates this a typical Tuesday at the Ministry.",
        ],
      },
      {
        title: "Level Two Lift Skips Hogwarts Liaison Again",
        dek: "The liaison office has requested stairs. The stairs have requested hazard pay.",
        body: [
          "For the eleventh time this term, the Ministry lift refused to open on the Hogwarts liaison floor, depositing clerks instead near {place} in a painting.",
          "{professor} received three clerks by Floo and sent them back with biscuits. {student} offered directions that led to the kitchens.",
          "A memo promises 'improved wayfinding by {year}.' The memo is from {year}.",
        ],
      },
    ],
  },
  {
    topicSlug: "creatures",
    authorSlugs: ["pandora-nettle", "seraphina-moon"],
    stories: [
      {
        title: "{creature} Loose Near {place} After Care of Magical Creatures",
        dek: "{student} says it was a misunderstanding. The creature has retained counsel.",
        body: [
          "A practical lesson ended early when {creature} took a professional interest in {place} and would not be bribed with biscuits.",
          "{professor} described the retrieval as 'mostly dignified.' Witnesses described it as a parade.",
          "{student} has been awarded house points for bravery and docked house points for providing a map.",
        ],
      },
      {
        title: "Centaurs Object to Night Games Beside the Forest",
        dek: "Astronomy homework, they argue, is not the same as a lantern festival.",
        body: [
          "A delegation from the Forbidden Forest asked Hogwarts to stop treating the tree line as {place} after dark.",
          "{student} was writing an essay by wand-light when a centaur inquired, politely, whether the stars had asked to be graded.",
          "{professor} has moved the class two lawns inward. The stars, so far, have not complained.",
        ],
      },
      {
        title: "Thestrals Seen by More Students Than the Timetable Allows",
        dek: "The herd near {place} has become an unofficial counselling service.",
        body: [
          "Care of Magical Creatures reported a spike in thestral sightings this term, particularly around {place}.",
          "{student} said the herd is 'better listeners than the portraits.' {professor} asked the Herald not to print that. We have printed that.",
          "Pandora Nettle reminds readers that seeing a thestral is not a house affiliation.",
        ],
      },
    ],
  },
  {
    topicSlug: "hogsmeade",
    authorSlugs: ["elowen-proudfoot", "rita-skeeter"],
    stories: [
      {
        title: "Honeydukes Rations Sugar Quills After {house} Weekend",
        dek: "The village reports a sweetness surplus and a patience deficit.",
        body: [
          "Shopkeepers on High Street limited sugar quills after {house} third-years treated {place} as an all-you-can-enchant buffet.",
          "{student} called the ration 'a human rights Howler.' The shop-cat called the ration overdue.",
          "Elowen Proudfoot recommends the unenchanted fudge. It cannot scream.",
        ],
      },
      {
        title: "Three Broomsticks Bans Hovering Mugs Until Further Notice",
        dek: "Foam on the ceiling is now a matter for the parish council.",
        body: [
          "Madam's weekend rush ended with three butterbeers docked at {place} and one mug applying for a forwarding address.",
          "{student} insisted the charm was 'just to keep the table clean.' {professor}, dining off-duty, billed the house.",
          "A chalkboard now reads: IF IT FLIES, IT IS NOT A TIP.",
        ],
      },
      {
        title: "Hogsmeade Station Adds Extra Owl for Sunday Returns",
        dek: "Parents, parcels, and one very lost {creature} all tried to board the same carriage.",
        body: [
          "Weekend traffic in {year} broke the unofficial record after {house} and {rival} both booked the village on the same Saturday.",
          "{student} missed the train, posted themselves by owl, and arrived crumpled but on time.",
          "The stationmaster has requested a second platform and a sense of proportion.",
        ],
      },
    ],
  },
  {
    topicSlug: "education",
    authorSlugs: ["minerva-quill", "tobias-inkwood"],
    stories: [
      {
        title: "New Charms Textbook Bites Three First-Years, Board Calls It Engaging",
        dek: "{professor} issued plasters and a reading schedule that includes gloves.",
        body: [
          "The {year} edition of Standard Book of Spells arrived hungry. Three first-years, including {student}, required plasters and a stern talking-to from the book.",
          "{professor} said a lively text improves retention. The book said, and we quote, 'turn the page or else.'",
          "The Board of Governors has called the edition 'engaging' and ordered more copies.",
        ],
      },
      {
        title: "OWL Week Timetable Conflicts With {place}",
        dek: "Examiners arrived to find the room had become a corridor.",
        body: [
          "Theory examinations were delayed after the scheduled room folded itself into {place} and refused to unfold for anyone without a password.",
          "{student} sat the paper on a stair. {professor} marked the stair for effort.",
          "The Wizarding Examinations Authority has requested rooms that do not have hobbies.",
        ],
      },
      {
        title: "{house} Study Group Invents Colour-Coded Howlers for Revision",
        dek: "Red means 'you forgot the incantation.' Gold means 'you forgot to sleep.'",
        body: [
          "A {house} revision circle led by {student} enchanted leftover Howlers to shout only the bits of the syllabus they had missed.",
          "Neighbours in {place} reported improved scores and reduced peace. {rival} students have filed a noise complaint written as an essay.",
          "{professor} confiscated the red ones and kept the gold ones. For research.",
        ],
      },
    ],
  },
  {
    topicSlug: "international",
    authorSlugs: ["lucian-pips", "caspian-thorne"],
    stories: [
      {
        title: "Beauxbatons Exchange Students Request Better Weather Charm",
        dek: "Hogwarts offered scarves. The visitors offered a petition.",
        body: [
          "A dozen exchange students arrived in {year} expecting {place} to be picturesque rather than wet. It was both.",
          "{student} ran an unofficial tour that began at the kitchens and ended, inevitably, at {place}.",
          "Lucian Pips notes that the visitors' silk gloves have joined a house-elf sewing circle.",
        ],
      },
      {
        title: "Durmstrang Delegation Lost Between {place} and Dinner",
        dek: "They followed a staircase. The staircase had other plans.",
        body: [
          "A visiting party from the north spent two hours circling {place} after a staircase chose a scenic route through last century.",
          "{professor} found them by smell of fur cloaks. {student} offered a map that was, unfortunately, also from last century.",
          "Dinner was held late. The visitors called the delay 'character-building' and asked for seconds.",
        ],
      },
      {
        title: "International Confundus Cup Rumours Sweep {place}",
        dek: "The Ministry says there is no tournament. The merch table disagrees.",
        body: [
          "Posters for an unsanctioned 'Confundus Cup' appeared near {place}, promising glory, travel, and a cup that forgets who won.",
          "{student} had already designed robes. {professor} had already drafted a ban.",
          "The Herald can confirm there is merch. The Herald cannot confirm there is a cup.",
        ],
      },
    ],
  },
  {
    topicSlug: "society",
    authorSlugs: ["rita-skeeter", "augusta-howl"],
    stories: [
      {
        title: "High Table Seating Chart Leaks, {house} Claims Moral Victory",
        dek: "Who sat beside the potatoes remains the central question of {year}.",
        body: [
          "A draft seating chart for the spring feast was found folded inside a menu at {place}. It has already been treated as canon.",
          "{student} circled their own name in gold ink. {rival} students circled it in something that hissed.",
          "Rita Skeeter will not speculate. She will, however, print the chart.",
        ],
      },
      {
        title: "Valentine Howlers Overwhelm the Owlery",
        dek: "Several owls have requested combat pay and throat lozenges.",
        body: [
          "The Owlery reported record volume after {house} and {rival} students exchanged singing valentines that refused to take no for an answer.",
          "{student} received twelve. Eleven were from the same person using different handwriting charms.",
          "Augusta Howl reminds readers that affection should be loud, but not structurally dangerous.",
        ],
      },
      {
        title: "Ghosts Host Midnight Salon in {place}",
        dek: "The living were invited. The living were late. The living were damp.",
        body: [
          "Nearly Headless Nick and friends held a salon to discuss castle politics, pudding, and whether {year} has been 'too loud.'",
          "{student} attended and reported that the punch was 'theoretical.' {professor} attended and reported the gossip was not.",
          "Minutes were taken in frost on a window. The window has since been opened.",
        ],
      },
    ],
  },
  {
    topicSlug: "investigations",
    authorSlugs: ["beatrix-crowe", "caspian-thorne"],
    stories: [
      {
        title: "Vanished Memos Found Filing Themselves in {place}",
        dek: "The paper trail had legs. Then it had a union.",
        body: [
          "A stack of missing Board memos resurfaced in {place}, alphabetising themselves and hissing at anyone who said 'urgent.'",
          "{student} tried to read one and was issued a receipt. {professor} tried to file one and was issued a warning.",
          "Beatrix Crowe followed the trail to a cupboard that is now, officially, an archive.",
        ],
      },
      {
        title: "House Points Hourglass Drains Upward Overnight",
        dek: "{house} woke rich. {rival} woke suspicious. The jewels refuse interviews.",
        body: [
          "Castle staff found the {house} hourglass fuller than physics, magic, or grudges can explain.",
          "{student} called it 'overdue justice.' {rival} prefects requested an independent jeweller.",
          "The jewels, when asked, arranged themselves into the shape of a shrug.",
        ],
      },
      {
        title: "Password to {place} Changes Every Time Someone Says It Aloud",
        dek: "A security charm with a sense of humour has halted two classes and one wedding toast.",
        body: [
          "The door to {place} now rejects any password that has been spoken in the corridor. Whispers count. Mouthing counts. Owls do not, yet.",
          "{student} got in by thinking very loudly. {professor} got in by being the password, which was rude of the door.",
          "Investigations will continue as soon as we remember how we left.",
        ],
      },
    ],
  },
  {
    topicSlug: "science",
    authorSlugs: ["seraphina-moon", "minerva-quill"],
    stories: [
      {
        title: "Astronomy Homework Claims Venus 'Refused to Cooperate'",
        dek: "{professor} accepted the excuse once. The planet has not issued a statement.",
        body: [
          "Third-year essays blamed Venus for incomplete charts after a cloudy week above {place}.",
          "{student} submitted a drawing of a planet with its arms crossed. {professor} wrote 'see me' and then, smaller, 'nice arms.'",
          "Seraphina Moon notes that Venus is often uncooperative. That is why we like her.",
        ],
      },
      {
        title: "Draught of Peace Trials Leave {place} Unusually Civil",
        dek: "For ninety minutes, {house} and {rival} queued. On purpose.",
        body: [
          "A supervised tasting in {year} produced what witnesses called 'the quietest argument in castle history.'",
          "{student} complimented a {rival} prefect's handwriting. Both parties have requested the memory be modified.",
          "The batch has been locked away. The civility, regrettably, wore off by supper.",
        ],
      },
      {
        title: "Charms Researchers Teach {place} to Hold Still for Portraits",
        dek: "The room agreed for one sitting. It has since demanded residuals.",
        body: [
          "A visiting enchanter attempted to steady {place} long enough for the yearbook. The room posed, then billed the school for time.",
          "{student} was included in the portrait by accident and now appears slightly to the left of history.",
          "{professor} called the project a success. The invoice called the project a lifestyle.",
        ],
      },
    ],
  },
];

const SEASONAL: {
  month: number;
  day: number;
  topicSlug: string;
  authorSlug: string;
  featured?: boolean;
  title: string;
  dek: string;
  body: string[];
}[] = [
  {
    month: 9,
    day: 1,
    topicSlug: "education",
    authorSlug: "minerva-quill",
    featured: true,
    title: "Start-of-Term Feast Opens {year} With Sorting, Weather, and Warnings",
    dek: "First-years found their houses. The ceiling found a new shade of drizzle. The Howler desk found work.",
    body: [
      "The {year} term opened in the Great Hall with the usual miracles: the ceiling remembered the sky, the hats remembered the heads, and the staff remembered which end of the table is High.",
      "{student} of {house} described the feast as 'louder than last year, which should not be possible.' {professor} used the announcements to ban three charms that had not been invented yet.",
      "The Herald's advice to first-years remains unchanged: follow a prefect, not a staircase.",
    ],
  },
  {
    month: 10,
    day: 31,
    topicSlug: "hogwarts",
    authorSlug: "tobias-inkwood",
    title: "Halloween Feast Survives {creature} and a Self-Carving Pumpkin",
    dek: "The bats were on time. The pudding was not. {place} was briefly orange.",
    body: [
      "Halloween in {year} delivered the traditional combination of delight and structural risk. A pumpkin in {place} attempted autobiography.",
      "{student} won the unofficial costume prize dressed as a Ministry decree. {professor} deducted points for accuracy.",
      "Ghosts reported the party 'adequately haunted.' The Herald takes this as a rave.",
    ],
  },
  {
    month: 12,
    day: 18,
    topicSlug: "society",
    authorSlug: "rita-skeeter",
    title: "Christmas at Hogwarts: Twelve Trees, One Argument, No Consensus",
    dek: "{house} wanted gold. {rival} wanted green. The elves wanted everyone to sit down.",
    body: [
      "Holiday decorations went up over {place} and immediately became a referendum on taste.",
      "{student} enchanted snow to fall upward. It was pretty until the owl post used it as a slide.",
      "Those remaining for Christmas will receive extra pudding and a reminder that Howlers still work in December.",
    ],
  },
  {
    month: 2,
    day: 14,
    topicSlug: "society",
    authorSlug: "augusta-howl",
    title: "Valentine's Post Sets New Record for Unsolicited Volume",
    dek: "The Owlery has asked lovers to consider handwriting, or at least indoor voices.",
    body: [
      "February the fourteenth in {year} produced a pink weather front above {place}. It sang.",
      "{student} attempted to return a Howler. The Howler followed them to lunch and read itself between courses.",
      "The Herald recommends flowers that do not talk. We sell none. We simply have standards.",
    ],
  },
  {
    month: 4,
    day: 1,
    topicSlug: "investigations",
    authorSlug: "beatrix-crowe",
    title: "Herald Exclusive: Hogwarts To Relocate to {place} — Then It Didn't",
    dek: "An April notice fooled three prefects, one governor, and briefly the ceiling.",
    body: [
      "A very official-looking notice announced that the castle would spend April in {place} 'for a change of air.' The stairs packed.",
      "{student} arrived with luggage. {professor} arrived with a counter-charm and a headache.",
      "The Herald regrets the confusion and, in the same sentence, does not. Happy April.",
    ],
  },
  {
    month: 6,
    day: 20,
    topicSlug: "education",
    authorSlug: "gideon-fleet",
    featured: true,
    title: "House Cup Heads to {house} After a Year of Loud Arithmetic",
    dek: "{rival} has requested a footnote. The jewels have requested a holiday.",
    body: [
      "End-of-term tallies in {year} put {house} ahead, {rival} close enough to sulk, and the hourglasses in need of a lie-down.",
      "{student} was credited with the decisive batch of points for 'services to {place}.' The services remain classified and slightly sticky.",
      "The cup will live in {house} common room until someone wobbles it again.",
    ],
  },
];

const LANDMARKS: {
  year: number;
  month: number;
  day: number;
  topicSlug: string;
  authorSlug: string;
  title: string;
  dek: string;
  body: string[];
}[] = [
  {
    year: 2006,
    month: 1,
    day: 12,
    topicSlug: "hogwarts",
    authorSlug: "tobias-inkwood",
    title: "Herald Opens Its Howler Desk as Hogwarts Settles Into Peace",
    dek: "A new paper for a rebuilt school: ink, parchment, and headlines that refuse to whisper.",
    body: [
      "With the castle's last scaffolding charms coming down, The Wizarding Herald begins publication from a cupboard that used to store brooms and now stores opinions.",
      "Our promise is simple. If it happened at Hogwarts, in Hogsmeade, or in a Ministry lift that will not open, we will print it at a decent shout.",
      "Subscriptions by owl. Complaints by Howler. We answer both.",
    ],
  },
  {
    year: 2006,
    month: 9,
    day: 3,
    topicSlug: "education",
    authorSlug: "minerva-quill",
    title: "First Full Post-Repair Term Begins Without a Missing Staircase",
    dek: "Governors call it stability. Students call it suspicious.",
    body: [
      "For the first September in recent memory, every listed staircase was where the map said it would be. Several prefects checked twice.",
      "Professor Vale told the Herald the castle is 'cooperating,' which in castle is a threat.",
      "The Howler desk is nonetheless staffed. Peace is not the same as quiet.",
    ],
  },
  {
    year: 2007,
    month: 3,
    day: 8,
    topicSlug: "international",
    authorSlug: "lucian-pips",
    title: "Beauxbatons Exchange Approved After Three Years of Owl Negotiations",
    dek: "Silk, snow, and a very detailed agreement about pudding.",
    body: [
      "The Ministry signed off on a student exchange that had been delayed by weather, pride, and an argument about whose elves make better pastry.",
      "Hogwarts will send six students in the spring. Beauxbatons has requested they bring their own rain.",
      "Lucian Pips will travel with the first party and file from a carriage that does not believe in roads.",
    ],
  },
  {
    year: 2008,
    month: 4,
    day: 22,
    topicSlug: "quidditch",
    authorSlug: "gideon-fleet",
    title: "New Stands Rise Over the Pitch, Slightly Crooked On Purpose",
    dek: "Architects say the lean improves sightlines. Beaters say it improves comedy.",
    body: [
      "Rebuilt Quidditch stands opened with a charm that keeps hats on and a lean that keeps photographers interested.",
      "Captain Otis Bramble called the view 'worth a Bludger to the ear.' We believe this was a compliment.",
      "First match under the new timber is Gryffindor versus Slytherin. Naturally.",
    ],
  },
  {
    year: 2009,
    month: 5,
    day: 2,
    topicSlug: "investigations",
    authorSlug: "beatrix-crowe",
    title: "Room of Requirement Briefly Reappears, Offers Tea, Vanishes",
    dek: "Three seventh-years received biscuits and a warning not to need so loudly.",
    body: [
      "A door that was not there on Monday was there on Tuesday, furnished like a parlour, and gone by Wednesday's Charms class.",
      "Witnesses say the room asked what they required, then suggested they require less.",
      "The Board has formed a committee. The committee cannot find the room. The committee is, ironically, in need.",
    ],
  },
  {
    year: 2010,
    month: 10,
    day: 9,
    topicSlug: "creatures",
    authorSlug: "pandora-nettle",
    title: "Centaur Treaty Talks Held at the Forest Edge, Not In It",
    dek: "Hogwarts brought tea. The herd brought conditions. Both left standing.",
    body: [
      "A dawn meeting produced a one-page understanding: lanterns stay on the lawn, divination stays in the tower, and nobody calls anyone 'folklore.'",
      "Professor Nightshade called the talks 'the most polite standoff of her career.'",
      "Students are reminded that the trees are not a shortcut, even when they look like one.",
    ],
  },
  {
    year: 2011,
    month: 2,
    day: 28,
    topicSlug: "hogwarts",
    authorSlug: "augusta-howl",
    title: "House-Elves Circulate Pamphlet on Breaks, Socks, and Pudding Rights",
    dek: "The kitchens remain fully staffed. The pamphlet is fully underlined.",
    body: [
      "A neatly folded notice appeared beside every platter this week, written in green ink, arguing for rota fairness and a ban on surprise banquets.",
      "The Head's office praised the prose and asked who taught them rhetoric. The elves praised the Head's office and asked who taught them to delay.",
      "The Herald prints labour news at the same volume as Quidditch. Especially labour news.",
    ],
  },
  {
    year: 2012,
    month: 11,
    day: 16,
    topicSlug: "education",
    authorSlug: "minerva-quill",
    title: "First Muggle-Born Careers Fair Packs the Great Hall",
    dek: "Aurors, healers, journalists, and one very lost accountant shared a table.",
    body: [
      "Hogwarts hosted its first fair aimed at students whose families do not automatically know what a wand can earn.",
      "Rita Skeeter ran a stall and left with three intern Howlers. The accountant ran a stall and left with a fear of quills.",
      "Minerva Quill calls it the most useful Saturday of the decade, and she has seen some Saturdays.",
    ],
  },
  {
    year: 2013,
    month: 1,
    day: 19,
    topicSlug: "creatures",
    authorSlug: "pandora-nettle",
    title: "Black Lake Freezes; Merpeople File Noise Complaint About Skating",
    dek: "The ice was charming. The singing underneath was not a sing-along.",
    body: [
      "A hard frost turned the lake into an unofficial pitch until a delegation surfaced, politely furious, with a petition written on kelp.",
      "Skating is now limited to the shallows and to people who can take criticism in song.",
      "Grounds staff have posted a sign: THE LAKE HAS RESIDENTS.",
    ],
  },
  {
    year: 2014,
    month: 7,
    day: 4,
    topicSlug: "international",
    authorSlug: "lucian-pips",
    title: "Ministry Denies Triwizard Revival After Goblet Sighting in Diagon Alley",
    dek: "A very old cup was seen in a shop window. The shop now sells soup.",
    body: [
      "Rumours of a fourth Triwizard Tournament flared after a tourist photographed a goblet that may have been a punch bowl.",
      "The Ministry issued a statement with five negatives in one sentence. Linguists are still counting.",
      "Hogwarts says there is no maze. The hedges, independently, have begun practising.",
    ],
  },
  {
    year: 2015,
    month: 3,
    day: 27,
    topicSlug: "hogwarts",
    authorSlug: "tobias-inkwood",
    title: "Staircase Census Complete: 142, Plus Three That Only Appear on Tuesdays",
    dek: "The map has been updated. The map is already lying again.",
    body: [
      "A year-long count of moving staircases concluded with a number, a footnote, and an apology to anyone who missed Transfiguration.",
      "The Tuesday stairs lead to a landing with an excellent view and no useful classrooms.",
      "Students may now collect a stamped card for visiting all 142. The three extras do not count. They know this. They do not care.",
    ],
  },
  {
    year: 2016,
    month: 8,
    day: 30,
    topicSlug: "science",
    authorSlug: "seraphina-moon",
    title: "Enchanted Ceiling Taken Down for Cleaning, Sky Briefly Unsupervised",
    dek: "For six hours the Great Hall had ordinary plaster. Morale dipped. Then it rained indoors on purpose.",
    body: [
      "Maintenance witches rolled the ceiling enchantment like a carpet and beat the dust out over the lake.",
      "Several ghosts complained the hall looked 'like a Muggle gymnasium, but with better portraits.'",
      "The sky was reinstalled before the feast. It showed a sunset that had not been ordered. The elves kept it.",
    ],
  },
  {
    year: 2017,
    month: 9,
    day: 2,
    topicSlug: "education",
    authorSlug: "minerva-quill",
    title: "A New Generation Finds the Sorting Hat Slightly More Sarcastic",
    dek: "First-years born after the war arrived with better shoes and the same nerves.",
    body: [
      "The Hat, which has heard every fear in the castle, added a running commentary this year that several parents did not find comforting.",
      "One first-year was told they would do well in any house 'if they stopped negotiating.' They went to Ravenclaw anyway.",
      "The Herald welcomes the new names. We have already misspelled two. Owls welcome.",
    ],
  },
  {
    year: 2018,
    month: 5,
    day: 2,
    topicSlug: "hogwarts",
    authorSlug: "tobias-inkwood",
    title: "Twenty Years On, the Great Hall Holds a Quiet Hour",
    dek: "No Howlers. No score. Names read once, then supper, then the usual noise of a living school.",
    body: [
      "Hogwarts marked two decades since the Battle with a simple list and a hall that chose, for once, not to rearrange itself.",
      "Students who were not born then stood with staff who were. The ceiling showed a clear night.",
      "The Herald printed extra copies and left the Howler desk closed until morning.",
    ],
  },
  {
    year: 2019,
    month: 6,
    day: 8,
    topicSlug: "quidditch",
    authorSlug: "gideon-fleet",
    title: "Firebolt Successor Trials Split the Pitch Into Believers and Skeptics",
    dek: "The new broom is faster, louder, and legally a small weather event.",
    body: [
      "Manufacturer trials over the Hogwarts pitch produced three records, two lost hats, and a letter from the Department of Magical Accidents.",
      "Gideon Fleet flew a lap and filed this sentence from a hedge.",
      "Students may not pre-order. Students have already pre-ordered.",
    ],
  },
  {
    year: 2020,
    month: 3,
    day: 21,
    topicSlug: "education",
    authorSlug: "caspian-thorne",
    title: "Hogwarts Seals Dormitories After Dragon Pox Cluster in Ravenclaw",
    dek: "Lessons move to common rooms. Owls move to shift work. The castle, for once, holds still.",
    body: [
      "A spring outbreak sent Ravenclaw into isolation and the rest of the school into a timetable that looks like a puzzle box.",
      "House-elves invented corridor meals. Professors invented corridor voices. The Herald invented working from a cupboard on purpose.",
      "The Ministry calls it 'proportionate.' The Howlers call it something we will not print.",
    ],
  },
  {
    year: 2021,
    month: 1,
    day: 11,
    topicSlug: "science",
    authorSlug: "seraphina-moon",
    title: "Remote Owl Lectures Declared a Success, Except by the Owls",
    dek: "A year of charmed blackboards and patient birds ends with extra mice and a union pamphlet.",
    body: [
      "Professors who spent 2020 shouting at parchment now shout at slightly more organised parchment.",
      "The Owlery reports repetitive strain and a request for Sundays off.",
      "In-person classes return in stages. Staircases have been briefed. Staircases were not listening.",
    ],
  },
  {
    year: 2022,
    month: 9,
    day: 1,
    topicSlug: "society",
    authorSlug: "rita-skeeter",
    title: "Full Return Feast: Every House, Every Course, Several Tears in the Soup",
    dek: "The hall was loud enough to satisfy the Howler desk without any Howlers at all.",
    body: [
      "Hogwarts packed the Great Hall for a start-of-term that felt like a reunion and a dare.",
      "Rita Skeeter observed who sat where and will be hearing about it until Christmas.",
      "The ceiling showed fireworks that nobody booked. The elves bowed. The ceiling, for once, bowed back.",
    ],
  },
  {
    year: 2023,
    month: 11,
    day: 4,
    topicSlug: "hogsmeade",
    authorSlug: "elowen-proudfoot",
    title: "Niffler Crime Wave Hits Honeydukes, Then Zonko's, Then a Prefect",
    dek: "Shiny things have been disappearing. So have the nifflers' alibis.",
    body: [
      "Hogsmeade shopkeepers reported a coordinated glitter theft that ended when a niffler tried to empty a prefect badge mid-lecture.",
      "The creature has been returned to Care of Magical Creatures. The badge has been returned to a very tired Hufflepuff.",
      "Elowen Proudfoot advises visitors to button their galleons.",
    ],
  },
  {
    year: 2024,
    month: 6,
    day: 21,
    topicSlug: "quidditch",
    authorSlug: "gideon-fleet",
    title: "Gryffindor Seeks Fourth Consecutive House Cup, Pitch Already Nervous",
    dek: "Slytherin has diagrams. Hufflepuff has snacks. Ravenclaw has a thesis.",
    body: [
      "If Gryffindor holds the cup again, it will be the longest run since the stands were rebuilt crooked.",
      "Captain Saffron Quinn declined to predict a winner and then predicted a winner.",
      "The jewels in the hourglasses have started leaning, which is not a recognised statistic, but we are watching.",
    ],
  },
  {
    year: 2025,
    month: 4,
    day: 16,
    topicSlug: "ministry",
    authorSlug: "caspian-thorne",
    title: "Ministry Prints Howgwarts on 400 Official Owls, Then Blames Autocorrect Charm",
    dek: "Hogwarts received an apology, a reprint, and a new joke that will outlive the building.",
    body: [
      "A batch of career-guidance owls left London addressed to Howgwarts School of Witchcraft and Wizardry. Three found a hill. One found us.",
      "The Ministry blamed a helpful charm that 'corrects uncommon place-names.' Hogwarts is, famously, a common place-name.",
      "The Herald will file Howgwarts as a search synonym and, if we are honest, as a house style for the letters page.",
    ],
  },
  {
    year: 2026,
    month: 2,
    day: 9,
    topicSlug: "science",
    authorSlug: "augusta-howl",
    title: "Herald Tests New Howler Network: Headlines Now Arrive at Maximum Volume",
    dek: "A twenty-year experiment in loud news reaches its intended setting. Neighbours have been warned.",
    body: [
      "From a broom cupboard in 2006 to a proper desk with two kettles, the Herald now delivers breaking notices on charmed parchment that reads itself at a civil shout.",
      "Augusta Howl, who has waited two decades for this sentence, asks readers to adjust their ear-muffs, not our volume.",
      "Search the archive. Twenty years of Hogwarts, Howgwarts, and everything in between, indexed at last.",
    ],
  },
  {
    year: 2026,
    month: 10,
    day: 18,
    topicSlug: "quidditch",
    authorSlug: "gideon-fleet",
    title: "Autumn Friendly Ends When Snitch Clock Off for the Weekend",
    dek: "The latest dispatch from a pitch that still believes in drama.",
    body: [
      "Saturday's match was called after the Snitch punched out on a timecard nobody authorised.",
      "Both captains agreed this was fair, then disagreed in writing, then asked the Herald to print both letters at full volume.",
      "We did. That is the job.",
    ],
  },
];

function authorName(slug: string) {
  return AUTHORS.find((author) => author.slug === slug)?.name ?? slug;
}

function topicName(slug: string) {
  return TOPICS.find((topic) => topic.slug === slug)?.name ?? slug;
}

function topicMeta(slug: string) {
  return TOPICS.find((topic) => topic.slug === slug);
}

function isoDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString().slice(0, 10);
}

function inRange(date: string) {
  return date >= `${START_YEAR}-01-01` && date <= END_DATE;
}

function buildDraft(story: {
  title: string;
  dek: string;
  body: string[];
  authorSlug: string;
  topicSlug: string;
  featured?: boolean;
}, c: Context): Draft {
  return {
    title: fill(story.title, c, true),
    dek: fill(story.dek, c, true),
    body: story.body.map((paragraph) => fill(paragraph, c)),
    authorSlug: story.authorSlug,
    topicSlug: story.topicSlug,
    featured: story.featured,
  };
}

function toArticle(
  draft: Draft,
  date: string,
  index: number,
  usedSlugs: Set<string>,
): Article {
  const topic = topicMeta(draft.topicSlug);
  let slug = slugify(draft.title);
  if (usedSlugs.has(slug)) slug = `${slug}-${date}`;
  if (usedSlugs.has(slug)) slug = `${slug}-${index}`;
  usedSlugs.add(slug);

  return {
    id: `wh-${String(index).padStart(4, "0")}`,
    slug,
    title: draft.title.replace(/^([a-z])/, (letter) => letter.toUpperCase()),
    dek: draft.dek,
    kicker: topic?.kicker ?? "News",
    body: draft.body,
    author: authorName(draft.authorSlug),
    authorSlug: draft.authorSlug,
    topic: topicName(draft.topicSlug),
    topicSlug: draft.topicSlug,
    publishedAt: date,
    year: Number(date.slice(0, 4)),
    featured: Boolean(draft.featured),
    motif: (topic?.motif ?? "castle") as Motif,
  };
}

function extraDeskDays(rng: Rng, year: number) {
  const days: [number, number][] = [];
  const count = year === END_YEAR ? 8 : 10;
  for (let i = 0; i < count; i += 1) {
    const month = 1 + Math.floor(rng() * 12);
    const day = 2 + Math.floor(rng() * 26);
    days.push([month, day]);
  }
  return days;
}

function generate() {
  const rng = mulberry32(20061020);
  const usedSlugs = new Set<string>();
  const articles: Article[] = [];
  let index = 1;

  const push = (draft: Draft, date: string) => {
    if (!inRange(date)) return;
    if (draft.featured && articles.some((article) => article.featured && article.publishedAt.slice(0, 4) === date.slice(0, 4))) {
      draft = { ...draft, featured: false };
    }
    articles.push(toArticle(draft, date, index, usedSlugs));
    index += 1;
  };

  for (const landmark of LANDMARKS) {
    const c = ctx(rng, landmark.year);
    push(buildDraft({ ...landmark, featured: true }, c), isoDate(landmark.year, landmark.month, landmark.day));
  }

  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    for (const seasonal of SEASONAL) {
      const c = ctx(rng, year);
      push(
        buildDraft(seasonal, c),
        isoDate(year, seasonal.month, seasonal.day),
      );
    }

    for (const [month, day] of extraDeskDays(rng, year)) {
      const desk = pick(rng, DESKS);
      const story = pick(rng, desk.stories);
      const c = ctx(rng, year);
      push(
        buildDraft(
          {
            ...story,
            authorSlug: pick(rng, desk.authorSlugs),
            topicSlug: desk.topicSlug,
          },
          c,
        ),
        isoDate(year, month, day),
      );
    }
  }

  articles.sort((a, b) => (a.publishedAt < b.publishedAt ? -1 : 1));
  return articles.map((article, articleIndex) => ({
    ...article,
    id: `wh-${String(articleIndex + 1).padStart(4, "0")}`,
  }));
}

const articles = generate();
const outDir = join(__dirname, "../src/data");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "articles.json");
writeFileSync(outFile, `${JSON.stringify(articles, null, 2)}\n`);

const years = new Set(articles.map((article) => article.year));
console.log(
  `Wrote ${articles.length} articles across ${years.size} years to ${outFile}`,
);
console.log(`Range ${articles[0]?.publishedAt} → ${articles.at(-1)?.publishedAt}`);
console.log(`Featured ${articles.filter((article) => article.featured).length}`);
