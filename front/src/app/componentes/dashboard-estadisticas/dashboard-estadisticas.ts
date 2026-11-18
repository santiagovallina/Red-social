import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { firstValueFrom } from 'rxjs';
import {
  Agrupacion,
  ComentariosDePublicacion,
  ComentariosEnElTiempo,
  PublicacionesDeUsuario,
} from '../../modelos/estadisticas';
import { EstadisticasApi } from '../../servicios/estadisticas-api';
import { Spinner } from '../spinner/spinner';

interface Lapso {
  id: string;
  etiqueta: string;
  dias: number;
  agrupar: Agrupacion;
}

const DIA_EN_MS = 24 * 60 * 60 * 1000;

const LAPSOS: Lapso[] = [
  { id: 'dia', etiqueta: 'Último día', dias: 1, agrupar: 'hora' },
  { id: 'semana', etiqueta: 'Últimos 7 días', dias: 7, agrupar: 'dia' },
  { id: 'mes', etiqueta: 'Último mes', dias: 30, agrupar: 'dia' },
  { id: 'anio', etiqueta: 'Último año', dias: 365, agrupar: 'mes' },
];

// Colores de la paleta del club (celeste y azul marino) y tonos intermedios.
const PALETA = ['#67BEF4', '#00022E', '#2E7DB8', '#A9D8F8', '#1B3A6B', '#8CB8D9', '#4A6FA5', '#C9E6FA'];

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

@Component({
  imports: [BaseChartDirective, Spinner],
  // Chart.js se registra solo en esta pantalla para no cargarlo en el resto de la app.
  providers: [provideCharts(withDefaultRegisterables())],
  selector: 'app-dashboard-estadisticas',
  styleUrl: './dashboard-estadisticas.css',
  templateUrl: './dashboard-estadisticas.html',
})
export class DashboardEstadisticas implements OnInit {
  private api = inject(EstadisticasApi);

  readonly lapsos = LAPSOS;
  lapsoId = signal('mes');
  cargando = signal(true);
  errorCarga = signal(false);

  publicaciones = signal<PublicacionesDeUsuario[]>([]);
  comentarios = signal<ComentariosEnElTiempo>({ total: 0, agrupar: 'dia', serie: [] });
  porPublicacion = signal<ComentariosDePublicacion[]>([]);

  lapso = computed(() => LAPSOS.find((l) => l.id === this.lapsoId()) ?? LAPSOS[2]);
  totalPublicaciones = computed(() =>
    this.publicaciones().reduce((suma, fila) => suma + fila.cantidad, 0),
  );

  datosTorta = computed<ChartData<'pie'>>(() => ({
    labels: this.publicaciones().map((fila) => `@${fila.usuario}`),
    datasets: [
      {
        data: this.publicaciones().map((fila) => fila.cantidad),
        backgroundColor: this.publicaciones().map((_, i) => PALETA[i % PALETA.length]),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }));

  datosLinea = computed<ChartData<'line'>>(() => ({
    labels: this.comentarios().serie.map((punto) => this.etiquetaDeFecha(punto.fecha, this.comentarios().agrupar)),
    datasets: [
      {
        label: 'Comentarios',
        data: this.comentarios().serie.map((punto) => punto.cantidad),
        borderColor: '#67BEF4',
        backgroundColor: 'rgba(103, 190, 244, 0.25)',
        pointBackgroundColor: '#00022E',
        fill: true,
        tension: 0.3,
      },
    ],
  }));

  datosBarras = computed<ChartData<'bar'>>(() => ({
    labels: this.porPublicacion().map((fila) => this.recortar(fila.titulo)),
    datasets: [
      {
        label: 'Comentarios',
        data: this.porPublicacion().map((fila) => fila.cantidad),
        backgroundColor: '#67BEF4',
        borderColor: '#00022E',
        borderWidth: 1,
      },
    ],
  }));

  opcionesTorta: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  opcionesLinea: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  opcionesBarras: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  ngOnInit() {
    this.cargar();
  }

  elegirLapso(id: string) {
    if (id === this.lapsoId() || this.cargando()) {
      return;
    }
    this.lapsoId.set(id);
    this.cargar();
  }

  async cargar() {
    const { dias, agrupar } = this.lapso();
    const hasta = new Date();
    const desde = new Date(hasta.getTime() - dias * DIA_EN_MS);

    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const [publicaciones, comentarios, porPublicacion] = await Promise.all([
        firstValueFrom(this.api.publicacionesPorUsuario(desde, hasta)),
        firstValueFrom(this.api.comentarios(desde, hasta, agrupar)),
        firstValueFrom(this.api.comentariosPorPublicacion(desde, hasta)),
      ]);
      this.publicaciones.set(publicaciones);
      this.comentarios.set(comentarios);
      this.porPublicacion.set(porPublicacion);
    } catch (error) {
      if (!(error instanceof HttpErrorResponse && error.status === 401)) {
        this.errorCarga.set(true);
      }
    } finally {
      this.cargando.set(false);
    }
  }

  private etiquetaDeFecha(clave: string, agrupar: Agrupacion) {
    if (agrupar === 'hora') {
      return clave.slice(11);
    }
    if (agrupar === 'mes') {
      const [anio, mes] = clave.split('-');
      return `${MESES[Number(mes) - 1]} ${anio}`;
    }
    const [, mes, dia] = clave.split('-');
    return `${dia}/${mes}`;
  }

  private recortar(texto: string) {
    return texto.length > 28 ? `${texto.slice(0, 27)}…` : texto;
  }
}
