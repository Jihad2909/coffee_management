import { Component } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [ToolbarModule,ButtonModule,
    AvatarModule,
    TooltipModule,],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {}
