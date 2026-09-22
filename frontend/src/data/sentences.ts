import { Sentence } from "@/types";

const easy: Sentence[] = [
  { id: "e1",  text: "I love eating spicy samosas.",                    difficulty: "easy" },
  { id: "e2",  text: "Cricket is a religion here.",                     difficulty: "easy" },
  { id: "e3",  text: "The Taj Mahal is beautiful.",                     difficulty: "easy" },
  { id: "e4",  text: "Let us drink ginger tea.",                        difficulty: "easy" },
  { id: "e5",  text: "Mango is the king fruit.",                        difficulty: "easy" },
  { id: "e6",  text: "Peacock is our national bird.",                   difficulty: "easy" },
  { id: "e7",  text: "Always wear a helmet.",                           difficulty: "easy" },
  { id: "e8",  text: "Diwali is the light festival.",                   difficulty: "easy" },
  { id: "e9",  text: "Auto rickshaws are everywhere.",                  difficulty: "easy" },
  { id: "e10", text: "Train journeys are very long.",                   difficulty: "easy" },
  { id: "e11", text: "Mother makes the best rotis.",                    difficulty: "easy" },
  { id: "e12", text: "Yoga keeps the mind calm.",                       difficulty: "easy" },
];

const medium: Sentence[] = [
  { id: "m1", text: "Street food in Mumbai is very famous.",            difficulty: "medium" },
  { id: "m2", text: "Please provide change for two thousand rupees.",   difficulty: "medium" },
  { id: "m3", text: "The monsoon rains bring relief from heat.",        difficulty: "medium" },
  { id: "m4", text: "Indian weddings last for many nights.",            difficulty: "medium" },
  { id: "m5", text: "Every Indian home has a spice box.",               difficulty: "medium" },
  { id: "m6", text: "We must keep our neighborhood very clean.",        difficulty: "medium" },
  { id: "m7", text: "Bollywood movies are full of dance sequences.",    difficulty: "medium" },
  { id: "m8", text: "Unity in diversity is our greatest strength.",     difficulty: "medium" },
];

const hard: Sentence[] = [
  { id: "h1", text: "The bustling local markets are filled with vibrant colors and loud voices.",       difficulty: "hard" },
  { id: "h2", text: "Determination and hard work are necessary to succeed in competitive exams.",       difficulty: "hard" },
  { id: "h3", text: "Spices like turmeric and cardamom have been used for centuries in medicine.",     difficulty: "hard" },
  { id: "h4", text: "Digital payments have completely transformed the way small businesses operate today.", difficulty: "hard" },
];

export const ALL_SENTENCES = { easy, medium, hard };
