import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListCoffee } from './list-coffee/list-coffee';
import { Panier } from './panier/panier';


@Component({
  imports: [CommonModule,ListCoffee, Panier],
  selector: 'app-commande',
  styleUrl: './commande.css',
  templateUrl: './commande.html',
})
export class Commande {

}
