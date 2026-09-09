import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEAM_NUMBERS = [
  "28657",
  "33863",
  "18472",
  "22109",
  "15680",
  "31002",
  "27441",
  "19853",
  "25611",
  "14200",
  "30155",
  "21888",
  "16742",
  "29001",
  "11380",
  "24077",
  "17555",
  "32700",
  "20914",
  "35102",
  "12880",
  "19340",
  "26418",
  "30577",
];

type SeedMatch = {
  number: number;
  red: [string, string];
  blue: [string, string];
  status: "SCHEDULED" | "IN_PROGRESS" | "FINISHED";
  scores?: [number, number];
  checkedIn?: string[];
};

const MATCHES: SeedMatch[] = [
  { number: 1, red: ["18472", "22109"], blue: ["15680", "31002"], status: "FINISHED", scores: [30, 20] },
  { number: 2, red: ["27441", "19853"], blue: ["25611", "14200"], status: "FINISHED", scores: [18, 27] },
  { number: 3, red: ["30155", "21888"], blue: ["16742", "29001"], status: "FINISHED", scores: [24, 16] },
  { number: 4, red: ["11380", "24077"], blue: ["17555", "32700"], status: "FINISHED", scores: [12, 22] },
  { number: 5, red: ["20914", "35102"], blue: ["12880", "19340"], status: "FINISHED", scores: [1, 0] },
  { number: 6, red: ["26418", "30577"], blue: ["28657", "33863"], status: "FINISHED", scores: [1, 2] },
  { number: 7, red: ["18472", "14200"], blue: ["22109", "16742"], status: "FINISHED", scores: [28, 19] },
  {
    number: 8,
    red: ["31002", "19853"],
    blue: ["33863", "25611"],
    status: "IN_PROGRESS",
    checkedIn: ["33863"],
  },
  { number: 9, red: ["28657", "27441"], blue: ["30155", "11380"], status: "SCHEDULED" },
  { number: 10, red: ["21888", "17555"], blue: ["15680", "20914"], status: "SCHEDULED" },
  { number: 11, red: ["29001", "32700"], blue: ["35102", "18472"], status: "SCHEDULED" },
  { number: 12, red: ["24077", "26418"], blue: ["28657", "12880"], status: "SCHEDULED" },
  { number: 13, red: ["19340", "30577"], blue: ["22109", "31002"], status: "SCHEDULED" },
  { number: 14, red: ["14200", "33863"], blue: ["27441", "21888"], status: "SCHEDULED" },
  { number: 15, red: ["28657", "15680"], blue: ["19853", "30155"], status: "SCHEDULED" },
  { number: 16, red: ["16742", "20914"], blue: ["11380", "25611"], status: "SCHEDULED" },
];

function kstDate(hours: number, minutes: number) {
  const stamp = `2026-09-09T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+09:00`;
  return new Date(stamp);
}

async function main() {
  await prisma.pushSubscription.deleteMany();
  await prisma.matchSlot.deleteMany();
  await prisma.match.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.event.deleteMany();

  const event = await prisma.event.create({
    data: { name: "울산프리미어리그 테스트" },
  });

  const teams = await Promise.all(
    TEAM_NUMBERS.map((number) =>
      prisma.team.create({
        data: { number, name: number },
      }),
    ),
  );
  const teamByNumber = new Map(teams.map((team) => [team.number, team]));

  const demoUsers = [
    { username: "28657", email: "28657@krc.app", role: "participant", teamNumber: "28657" },
    { username: "33863", email: "33863@krc.app", role: "participant", teamNumber: "33863" },
    { username: "admin", email: "admin@krc.app", role: "staff", teamNumber: null },
  ];

  for (const demo of demoUsers) {
    const passwordHash = await bcrypt.hash(demo.email, 10);
    await prisma.user.create({
      data: {
        username: demo.username,
        email: demo.email,
        passwordHash,
        role: demo.role,
        teamId: demo.teamNumber ? teamByNumber.get(demo.teamNumber)?.id : null,
      },
    });
  }

  for (const match of MATCHES) {
    const startMinutes = 13 * 60 + (match.number - 1) * 6;
    const startHours = Math.floor(startMinutes / 60);
    const startMins = startMinutes % 60;
    const closeMinutes = startMinutes - 4;
    const closeHours = Math.floor(closeMinutes / 60);
    const closeMins = closeMinutes % 60;

    const created = await prisma.match.create({
      data: {
        eventId: event.id,
        number: match.number,
        status: match.status,
        redScore: match.scores?.[0] ?? null,
        blueScore: match.scores?.[1] ?? null,
        startAt: kstDate(startHours, startMins),
        entryCloseAt: kstDate(closeHours, closeMins),
      },
    });

    const slots = [
      { alliance: "RED", station: 1, number: match.red[0] },
      { alliance: "RED", station: 2, number: match.red[1] },
      { alliance: "BLUE", station: 1, number: match.blue[0] },
      { alliance: "BLUE", station: 2, number: match.blue[1] },
    ];

    for (const slot of slots) {
      const team = teamByNumber.get(slot.number);
      if (!team) throw new Error(`Missing team ${slot.number}`);
      await prisma.matchSlot.create({
        data: {
          matchId: created.id,
          teamId: team.id,
          alliance: slot.alliance,
          station: slot.station,
          checkedIn: match.checkedIn?.includes(slot.number) ?? false,
        },
      });
    }
  }

  console.log("Seeded event, 24 teams, 16 matches, and demo users.");
  console.log("Demo logins (username / password):");
  console.log("  28657 / 28657@krc.app");
  console.log("  33863 / 33863@krc.app");
  console.log("  admin / admin@krc.app");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
