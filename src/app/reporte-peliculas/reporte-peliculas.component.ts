import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, StyleDictionary } from 'pdfmake/interfaces';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  filtroGenero: string = '';
  filtroAnio: number | undefined;
  peliculasFiltradas: any[] = [];
  generos: string[] = [];
  anios: number[] = [];

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
      this.obtenerValoresUnicos();
    });
  }

  obtenerValoresUnicos() {
    const generosSet = new Set<string>();
    const aniosSet = new Set<number>();

    for (const pelicula of this.peliculas) {
      generosSet.add(pelicula.genero);
      aniosSet.add(pelicula.lanzamiento);
    }

    this.generos = Array.from(generosSet);
    this.anios = Array.from(aniosSet);
  }

  generarPDF() {
    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            ['Título', 'Género', 'Año de lanzamiento'],
            ...this.peliculasFiltradas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
          ]
        }
      }
    ];
  
    const estilos: StyleDictionary = {
      header: {
        fontSize: 28,
        background:'#F9E79F' ,
        bold: true,
        margin: [0, 0, 0, 10], 
        color: '#333333', 
        fillColor: 'F9E79F' 
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'Green',
        fillColor: 'F9E79F'
      },
      tableCell: {
        fontSize: 22,
        color: '#F9E79F'
      }
    };
  
    const pdfContent: TDocumentDefinitions = {
      content: contenido,
      styles: estilos
    };
  
    (pdfMake.createPdf as any)(pdfContent).open();
  }

  exportarExcel() {
    const peliculasExport = this.peliculasFiltradas.length > 0 ? this.peliculasFiltradas : this.peliculas;

    const worksheet = XLSX.utils.json_to_sheet(peliculasExport);
    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'reporte_peliculas.xlsx');
  }

  aplicarFiltros() {
    this.peliculasFiltradas = this.peliculas.filter(pelicula => {
      const coincideGenero =
        !this.filtroGenero || pelicula.genero.toLowerCase().includes(this.filtroGenero.toLowerCase());
      const coincideAnio = !this.filtroAnio || pelicula.lanzamiento === this.filtroAnio;
      return coincideGenero && coincideAnio;
    });

    this.generarPDF();
  }

  limpiarFiltros() {
    this.filtroGenero = '';
    this.filtroAnio = undefined;
    this.peliculasFiltradas = [];

    this.generarPDF();
  }
}
