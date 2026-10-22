export interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  image: string;
  categorie: string;
}

export interface PanierItem extends Produit {
  quantite: number;
}