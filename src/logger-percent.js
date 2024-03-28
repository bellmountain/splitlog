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

function makeLogger(
  rows,
  callback = () => {},
  opts = { split: true, maxEntries: 800 },
) {
  const rl = readline.createInterface({
    input,
    output,
  });

  const rowsSize = rows.reduce((a, b) => a + b.height, 0);
  if (rowsSize > 100) throw "Too many rows";

  let loggers = [];
  let index = 0;
  let scrollState = 0;

  for (const row of rows) {
    row.index = index;
    row.queue = createBoundedQueue(opts.maxEntries);
    row.render = () => {
      const round = row.index % 2 === 0 ? Math.floor : Math.ceil;
      let size = round(
        ((process.stdout.rows - (opts.split ? rows.length + 1 : 1)) *
          row.height) /
          100,
      );
      // throw size;

      return row.queue.get(size, process.stdout.columns - 1, scrollState);
    };

    index++;

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

    // for (let i = rowsSize; i < process.stdout.rows - 3; i++) {
    //   text += i + ".".repeat(process.stdout.columns - 2) + "\n";
    // }

    // TODO fix cursor position not showing correctly
    text +=
      "rl.line: " +
      rl.line +
      cursorSavePosition +
      "  end" +
      cursorRestorePosition;

    process.stdout.write(text);
  }
  //
  process.stdin.on("keypress", (character, keyInfo) => {
    loggers[0].log(character);
    loggers[0].log(keyInfo.name ? keyInfo.name : "");
    // loggers[1].log(keyInfo.entries ? keyInfo.entries().toString() : "");

    if (keyInfo.name === "pageup") {
      if (scrollState > 0) scrollState--;
    }
    if (keyInfo.name === "pagedown") {
      if (scrollState < opts.maxEntries) scrollState++;
    }
    render();
    // if (keyInfo.name === "pageup") loggers[0].log("page up");
    // if (keyInfo.name === "pagedown") loggers[0].log("page down");
  });

  process.stdout.on("resize", render);
  // setInterval(render, 500);
  // process.stdin.on("keypress", render);

  rl.on("line", (line) => callback(line, loggers));

  return loggers;
}

export default makeLogger;
