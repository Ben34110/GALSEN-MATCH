import type { Article } from "@/types";

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60_000).toISOString();
}

// Contenu de démonstration — sources fictives (domaines .example, RFC 2606)
// en attendant le branchement du pipeline RSS réel. Chaque entrée respecte
// le format imposé : résumé + source_name + source_url non nuls.
export const articles: Article[] = [
  {
    id: "a1",
    title: "Jaraaf breloque son mercato hivernal avec l'arrivée d'un milieu formé au centre CNEPS",
    summaryAi:
      "Le club dakarois renforce son entrejeu à quelques journées de la fin de la phase régulière. Le joueur, âgé de 21 ans, s'engage pour trois saisons et pourrait débuter dès la prochaine journée.",
    sourceName: "Sénégal Sport Info",
    sourceUrl: "https://senegalsportinfo.example/mercato/jaraaf-recrue-milieu",
    category: "mercato",
    publishedAt: hoursAgo(3),
  },
  {
    id: "a2",
    title: "Ligue 1 Sénégal : Teungueth FC reprend la tête après sa victoire à Guédiawaye",
    summaryAi:
      "Portée par un doublé en seconde période, l'équipe de Rufisque s'installe provisoirement en tête du championnat avant la clôture de la 12e journée, avec deux points d'avance sur Jaraaf.",
    sourceName: "AfriFoot Actu",
    sourceUrl: "https://afrifootactu.example/ligue1/journee-12-teungueth",
    category: "ligue1-sn",
    publishedAt: hoursAgo(7),
  },
  {
    id: "a3",
    title: "CAN 2025 : la liste élargie des Lions attendue avant la fin du mois",
    summaryAi:
      "Le sélectionneur devrait dévoiler une pré-liste de 35 joueurs avant les derniers matchs de qualification. Plusieurs binationaux évoluant en Europe seraient inclus pour la première fois.",
    sourceName: "Ballon Dakar",
    sourceUrl: "https://ballondakar.example/equipe-nationale/can2025-preliste",
    category: "can2025",
    publishedAt: hoursAgo(14),
  },
  {
    id: "a4",
    title: "Casa Sports : le gardien international proche d'un départ vers le Golfe",
    summaryAi:
      "Selon plusieurs sources concordantes, un club saoudien de deuxième division aurait formulé une offre concrète pour le portier ziguinchorois. Le club dément pour l'instant toute négociation avancée.",
    sourceName: "Sénégal Sport Info",
    sourceUrl: "https://senegalsportinfo.example/mercato/casa-sports-gardien-depart",
    category: "mercato",
    publishedAt: hoursAgo(20),
  },
  {
    id: "a5",
    title: "Diaspora : un tournoi inter-communautés organisé à Paris pour soutenir la formation locale",
    summaryAi:
      "L'événement, prévu sur trois week-ends, doit reverser une partie des recettes à des centres de formation sénégalais. Une dizaine d'équipes amateurs de la région parisienne sont déjà inscrites.",
    sourceName: "AfriFoot Actu",
    sourceUrl: "https://afrifootactu.example/diaspora/tournoi-paris-formation",
    category: "communaute",
    publishedAt: hoursAgo(29),
  },
  {
    id: "a6",
    title: "AS Pikine annonce la prolongation de son entraîneur jusqu'en 2027",
    summaryAi:
      "Arrivé en cours de saison dernière, le technicien a stabilisé l'équipe dans le milieu de tableau. Le club évoque un projet de continuité autour d'un noyau de joueurs formés au club.",
    sourceName: "Ballon Dakar",
    sourceUrl: "https://ballondakar.example/ligue1/as-pikine-prolongation-coach",
    category: "ligue1-sn",
    publishedAt: hoursAgo(36),
  },
];
