
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { SqliteService } from 'src/app/services/sqlite.service'; // Importar el servicio
import { TorneoService } from 'src/app/services/torneo-service.service'; //servicio de notificaciones toneos 

interface Torneo {
  id: number;
  nombre: string;
  juego: string;
  estado: string;
  numEquipos: number;
  fechaInicio: string;
  imagen: string;
}

@Component({
  selector: 'app-detalles-torneo',
  templateUrl: './detalles-torneo.page.html',
  styleUrls: ['./detalles-torneo.page.scss'],
})
export class DetallesTorneoPage implements OnInit {
  torneo?: Torneo;
  usuarios: any[] = [];

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private alertController: AlertController,
    private sqliteService: SqliteService, // Aquí se inyecta el servicio
    private torneoService: TorneoService  //servicio de notificaciones
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params && params['torneo']) {
        try {
          this.torneo = JSON.parse(params['torneo']);
          if (this.torneo && this.torneo.id) {
            this.cargarUsuariosInscritos(this.torneo.id);
          }
        } catch (error) {
          console.error('Error al parsear el torneo:', error);
          this.router.navigate(['/cuenta-admin']);
        }
      }
    });
  }

async cargarUsuariosInscritos(id_torneo: number) {
    try {
      this.usuarios = await this.sqliteService.obtenerUsuariosInscritos(id_torneo);
    } catch (error) {
      console.error('Error al cargar usuarios inscritos:', error);
    }
  }

  modificarTorneo() {
    if (this.torneo && this.torneo.id) {
      this.router.navigate(['/modificar-torneo'], {
        queryParams: {
          torneo: JSON.stringify(this.torneo) // Pasa el objeto del torneo
        }
      });
    } else {
      console.warn('No se puede modificar, torneo no válido');
    }
  }
  

  async eliminarTorneo() {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas eliminar este torneo?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: async () => {
            if (this.torneo) {
              try {
                // Primero, elimina las inscripciones del torneo
                await this.sqliteService.eliminarInscripcionesPorTorneo(this.torneo.id); // Método para eliminar inscripciones
  
                // Ahora elimina el torneo
                await this.sqliteService.eliminarTorneo(this.torneo.id);
                this.torneoService.notificarTorneoEliminado();
                const successAlert = await this.alertController.create({
                  header: 'Éxito',
                  message: 'El torneo ha sido eliminado con éxito.',
                  buttons: ['OK']
                });
                await successAlert.present();
                this.router.navigate(['/cuenta-admin']);
              } catch (error) {
                console.error('Error al eliminar el torneo:', error);
                const errorAlert = await this.alertController.create({
                  header: 'Error',
                  message: 'Hubo un error al eliminar el torneo. Inténtalo de nuevo.',
                  buttons: ['OK']
                });
                await errorAlert.present();
              }
            }
          }
        }
      ]
    });
  
    await alert.present();
  }
  
}

