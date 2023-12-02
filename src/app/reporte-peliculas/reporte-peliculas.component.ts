import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Pipe, PipeTransform } from '@angular/core';

import * as XLSX from 'xlsx';

@Pipe({
  name: 'filtrarPeliculas'
})
export class FiltrarPeliculasPipe implements PipeTransform {
  transform(peliculas: any[], genero: string, anno: string): any[] {
    return peliculas.filter(pelicula =>
      (!genero || pelicula.genero === genero) &&
      (!anno || pelicula.lanzamiento === parseInt(anno, 10))
    );
  }
}


type Alignment = 'left' | 'center' | 'right' | 'justify';

interface Style {
  fontSize?: number;
  bold?: boolean;
  color?: string;
  alignment?: Alignment;
  margin?: [number, number, number, number];
}

interface StyleDictionary {
  [name: string]: Style;
}

interface TDocumentDefinitions {
  content: any[];
  styles?: { [name: string]: Style };
}

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];

  filtroGenero: string = '';
  filtroAnno: string = '';

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
    });
  }

  generarExcel() {
    // Obtener películas filtradas
    const peliculasFiltradas = this.peliculas.filter(pelicula =>
      (!this.filtroGenero || pelicula.genero === this.filtroGenero) &&
      (!this.filtroAnno || pelicula.lanzamiento === parseInt(this.filtroAnno, 10))
    );

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(peliculasFiltradas);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'reporte_peliculas');
    XLSX.writeFile(wb, 'reporte_peliculas.xlsx');
  }


  generarPDF() {
    // Obtener películas filtradas
    const peliculasFiltradas = this.peliculas.filter(pelicula =>
      (!this.filtroGenero || pelicula.genero === this.filtroGenero) &&
      (!this.filtroAnno || pelicula.lanzamiento === parseInt(this.filtroAnno, 10))
    );

    // Crear contenido del informe con películas filtradas
    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            ['Título', 'Género', 'Año de lanzamiento'],
            ...peliculasFiltradas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
          ]
        },
        layout: {
          fillColor: function (rowIndex: number) {
            return (rowIndex % 2 === 0) ? '#F0F0F0' : null;
          },
          hLineWidth: function (i: number) {
            return (i === 0 || i === 1) ? 1 : 0;
          },
          vLineWidth: function (i: number) {
            return 0;
          },
          paddingLeft: function (i: number) {
            return 8;
          },
          paddingRight: function (i: number) {
            return 8;
          },
          alignment: 'left' as Alignment
        }
      }
    ];

    const estilos: StyleDictionary = {
      header: {
        fontSize: 18,
        bold: true,
        color: '#4CAF50',
        alignment: 'center' as Alignment
      },
      table: {
        fontSize: 12,
        margin: [0, 5, 0, 15],
      }
    };

    const documentDefinition: TDocumentDefinitions = {
      content: contenido,
      styles: estilos
    };

    pdfMake.createPdf(documentDefinition).open();
  }


  obtenerGenerosUnicos(): string[] {
    return [...new Set(this.peliculas.map(pelicula => pelicula.genero))];
  }

  obtenerAnnosUnicos(): string[] {
    return [...new Set(this.peliculas.map(pelicula => pelicula.lanzamiento))];
  }
}
