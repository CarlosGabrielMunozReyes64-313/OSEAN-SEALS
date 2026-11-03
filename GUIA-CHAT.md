# Chat de Ocean-Seals

## Probarlo
Descomprime el proyecto, entra en la carpeta que contiene package.json y ejecuta estos comandos en una terminal:

```sh
npm ci
npm run dev-nolog
```

Abre la dirección que muestra Vite y haz clic en el menú para entrar. Puedes moverte con clic, toque, WASD o flechas. Pulsa Enter o toca la barra para escribir. Enter envía el mensaje. Escape borra el borrador y vuelve al juego.

## Archivos, en orden de integración

1. **public/assets/ui/barra-chat.png** contiene la barra preparada a 800 × 92. El campo ocupa el rectángulo interior de x=34 a 767 y de y=25 a 71. Su posición y tamaño son proporcionales al marco cuando se reduce la ventana.
2. **src/game/main.ts** activa `dom: { createContainer: true }`. Esto permite colocar un elemento HTML sobre el lienzo del juego.
3. **src/game/scenes/Preloader.ts** carga el PNG con la clave `barra-chat`. Como el cargador ya usa la carpeta assets, la ruta que recibe es `ui/barra-chat.png`.
4. **src/game/ui/ChatBar.ts** crea un elemento DOM de Phaser que contiene el marco y un campo HTML transparente. El navegador se encarga del cursor, las tildes y el pegado. El límite se fija con `maxLength = 50`. Puedes añadir tus reglas a `filtrarMensaje(texto)` antes de enviar. **public/style.css** define el color del texto de ayuda.
5. **src/game/objects/SpeechBubble.ts** dibuja el globo, divide el texto en líneas y actualiza su posición siguiendo al avatar. Espera cinco segundos y después reduce su opacidad durante 350 milisegundos.
6. **src/game/objects/Player.ts** expone `player.say('¡Hola!')`. Cada jugador tiene su propia burbuja. Un mensaje nuevo reemplaza la anterior y desaparecerá con ella si se elimina al jugador.
7. **src/game/scenes/Game.ts** conecta el envío a `player.say(texto)`. Al entrar en el campo, detiene a la foca, cancela el destino marcado y restablece las teclas. Mientras el campo tiene el foco, los eventos de teclado sirven para editar el texto. Al salir, vuelven los controles de movimiento.

## Prueba rápida

- Camina hacia un punto y pulsa Enter antes de llegar. La foca debe detenerse.
- Escribe «¡Mañana nadamos!». Usa las flechas para mover el cursor y comprueba que la foca sigue quieta.
- Envía el mensaje y camina. La burbuja debe seguirte. Envía otro mensaje antes de cinco segundos para reemplazarla.
- Prueba Escape con un borrador y Enter con un campo lleno de espacios. Ninguno debe crear una burbuja.

El envío funciona dentro de esta partida local. Cuando añadas el servidor, podrás llamar a `jugadorRemoto.say(texto)` al recibir un mensaje de ese jugador.
