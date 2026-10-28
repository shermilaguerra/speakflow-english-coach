export type TopicId = "livre" | "viagens" | "trabalho" | "restaurantes" | "compras" | "entrevistas" | "cotidiano";

export const TOPICS: { id: TopicId; label: string; emoji: string; desc: string; prompt: string; greeting: string }[] = [
  { id: "livre", label: "Conversa livre", emoji: "💬", desc: "Fale sobre o que quiser", prompt: "a free conversation about anything the student wants", greeting: "Hey there! I'm Flow, your English teacher. 😄 What would you like to talk about today? Anything goes — your weekend, a movie, a crazy dream…" },
  { id: "viagens", label: "Viagens", emoji: "✈️", desc: "Aeroporto, hotel, passeios", prompt: "travel situations: airports, hotels, asking for directions, sightseeing", greeting: "Welcome aboard! ✈️ Let's pretend you just landed in London. I'm the friendly person at the hotel reception. Good evening! Do you have a reservation?" },
  { id: "trabalho", label: "Trabalho", emoji: "💼", desc: "Reuniões, colegas, e-mails", prompt: "work situations: meetings, colleagues, small talk at the office, describing your job", greeting: "Good morning, colleague! ☕ Grab a coffee. So, tell me — what do you do for a living, and what's your typical day like?" },
  { id: "restaurantes", label: "Restaurantes", emoji: "🍝", desc: "Pedir comida, reservas", prompt: "restaurant situations: booking a table, ordering food, asking about the menu, paying the bill", greeting: "Hi, welcome to Flow's Bistro! 🍝 I'll be your waiter tonight. Table for how many people?" },
  { id: "compras", label: "Compras", emoji: "🛍️", desc: "Lojas, preços, trocas", prompt: "shopping situations: asking for sizes, prices, returning items, paying", greeting: "Hello and welcome to the store! 🛍️ Are you looking for anything in particular today?" },
  { id: "entrevistas", label: "Entrevistas", emoji: "🎯", desc: "Entrevista de emprego", prompt: "a job interview practice where the teacher is a friendly interviewer", greeting: "Hi, thanks for coming in today! 🎯 Let's start simple: could you tell me a little about yourself?" },
  { id: "cotidiano", label: "Cotidiano", emoji: "🏡", desc: "Rotina, família, hobbies", prompt: "everyday life: routine, family, hobbies, weekend plans", greeting: "Hey! 🏡 Let's chat about everyday life. What did you do last weekend?" },
];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id) ?? TOPICS[0]!;
