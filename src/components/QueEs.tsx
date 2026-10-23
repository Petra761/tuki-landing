// src/components/QueEs.tsx
// Qué es Tuki, qué problema resuelve y a quién va dirigido.

import { Palabras } from './Palabras'
import './QueEs.css'

export function QueEs() {
  return (
    <section id="que-es" className="seccion que-es" aria-labelledby="que-es-titulo">
      <div className="contenedor que-es__rejilla">
        <h2 id="que-es-titulo" className="que-es__titulo">
          <Palabras texto="Llevar tus cuentas no debería ser otra tarea pendiente." alEntrar />
        </h2>

        <div className="que-es__textos">
          <article>
            <h3>El problema</h3>
            <p>
              Muchas personas anotan sus gastos en un cuaderno, en las notas del celular o de memoria, y
              a fin de mes no saben a dónde fue el dinero. Cuando hay que registrar algo, se posterga.
            </p>
          </article>
          <article>
            <h3>Lo que hace Tuki</h3>
            <p>
              Junta todo en un solo lugar: lo que entra, lo que sale y lo que te queda en cada cuenta.
              Está pensado para registrar rápido, desde el celular, y ver tu historial cuando lo necesites.
            </p>
          </article>
          <article>
            <h3>Para quién es</h3>
            <p>
              Para quien quiere ordenar su dinero personal: estudiantes, personas que viven de un sueldo y
              quienes tienen ingresos que cambian de un mes a otro.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
