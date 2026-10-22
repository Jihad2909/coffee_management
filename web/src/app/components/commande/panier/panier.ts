import { Component, inject } from '@angular/core';
import { CommandeService } from '../commande.service';
import { PanierItem } from '../../../models/produit.model';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-panier',
  styleUrl: './panier.css',
  templateUrl: './panier.html',
})
export class Panier {
  private commande = inject(CommandeService);

  items = this.commande.panier;
  sousTotal = this.commande.sousTotal;
  tva = this.commande.tva;
  total = this.commande.total;
  count = this.commande.count;

  augmenter(item: PanierItem) { this.commande.augmenter(item); }
  diminuer(item: PanierItem)  { this.commande.diminuer(item); }
  retirer(item: PanierItem)   { this.commande.retirer(item); }
  valider()                   { this.commande.valider(); }
}
