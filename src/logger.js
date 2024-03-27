import * as readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import createBoundedQueue from "./logqueue.js";
import ansiEscapes from "ansi-escapes";
import stringWidth from "string-width";

const {
    cursorSavePosition,
    cursorRestorePosition,
    eraseLines,
    cursorTo,
    clearScreen,
  } = ansiEscapes,
  enableMouse = "\x1b[?1000h",
  disableMouse = "\x1b[?1000l";

function cursorToBottom(col = 0) {
  return cursorTo(col, process.stdout.rows - 1);
}

function makeLogger(rows, callback = () => {}, opts = { split: true }) {
  const rl = readline.createInterface({
    input,
    output,
  });

  const rowsSize = rows.reduce((a, b) => a + b.height, 0);
  let loggers = [];

  for (const row of rows) {
    row.queue = createBoundedQueue(80);
    row.render = () => row.queue.get(row.height, process.stdout.columns - 1);

    loggers.push({
      log: (msg) => {
        row.queue.enqueue(
          row.date ? new Date().toLocaleTimeString() + ": " + msg : msg,
        );
        render();
      },
    });
  }

  function render() {
    let text = clearScreen + cursorTo(0, 0);

    for (const row of rows) {
      text += row.render();
      if (opts.split) {
        text += "-".repeat(process.stdout.columns - 1) + "\n";
      }
    }
    for (let i = rowsSize; i < process.stdout.rows - 3; i++) {
      text += i + ".".repeat(process.stdout.columns - 2) + "\n";
    }

    text +=
      "rl.line: " +
      rl.line +
      cursorSavePosition +
      "  end" +
      cursorRestorePosition;

    process.stdout.write(text);
  }
  // process.stdin.on("keypress", (character, keyInfo) => {
  //   loggers.forEach((logger) => {
  //     logger.log(character, keyInfo);
  //   });
  // });

  process.stdin.on("keypress", render);
  process.stdout.on("resize", render);
  // setInterval(render, 500);

  rl.on("line", (line) => callback(line, loggers));

  return loggers;
}

export default makeLogger;
