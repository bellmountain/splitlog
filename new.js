import * as readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import createBoundedQueue from "./logqueue.js";
import ansiEscapes from "ansi-escapes";
import color from "ansi-colors";
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

    // Assume totalScroll is the total number of scrollable steps.
    let totalScroll = opts.maxEntries;
    let screenRows = process.stdout.rows - 1; // One row less for status or input line

    // Calculate the scrollbar handle size based on the number of rows and total scrollable steps.
    let handleSize = Math.max(
      1,
      Math.floor(screenRows * (screenRows / totalScroll)),
    );

    // Calculate the scrollbar position.
    let scrollPosition = Math.floor(
      (scrollState / totalScroll) * (screenRows - handleSize),
    );

    for (let i = 0; i < process.stdout.rows - 1; i++) {
      text +=
        ".".repeat(process.stdout.columns - 1) +
        (i === scrollPosition ? color.bgCyan(" ") : " " + "\n");
    }

    // for (const row of rows) {
    //   text += row.render();
    //   if (opts.split) {
    //     text += "-".repeat(process.stdout.columns - 1) + "\n";
    //   }
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
  process.stdin.on("keypress", (character, key) => {
    if (key.name === "pageup") {
      if (scrollState > 0) scrollState--;
    }
    if (key.name === "pagedown") {
      if (scrollState < opts.maxEntries) scrollState++;
    }
    render();
  });

  process.stdout.on("resize", render);

  rl.on("line", (line) => callback(line, loggers));

  return loggers;
}

function newRow(opts) {
  return {
    height: opts.height,
    render: (width, height) => {
      let text = "";
      for (let i = 0; i < height; i++) {
        text += ".".repeat(width) + "\n";
      }
      return text;
    },
  };
}

export default makeLogger;
