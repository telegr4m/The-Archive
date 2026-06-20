export type ProfileGame = {
  title: string;
  imagePath: string;
  imageFit?: "cover" | "contain";
  imagePosition?: string;
};

// Add future games here after placing their cover in public/images/games.
export const profileGames: ProfileGame[] = [
  {
    title: "Minecraft",
    imagePath: "/images/games/minecraft.jpg",
    imageFit: "cover",
    imagePosition: "center 52%",
  },
  {
    title: "Valorant",
    imagePath: "/images/games/valorant.jpg",
    imageFit: "cover",
    imagePosition: "55% center",
  },
  {
    title: "League of Legends",
    imagePath: "/images/games/league-of-legends.jpg",
    imageFit: "cover",
    imagePosition: "62% center",
  },
  {
    title: "osu!",
    imagePath: "/images/games/osu.jpg",
    imageFit: "cover",
  },
  {
    title: "Roblox",
    imagePath: "/images/games/roblox.jpg",
    imageFit: "cover",
  },
  {
    title: "CS2",
    imagePath: "/images/games/cs2.jpg",
    imageFit: "cover",
  },
];
