import makeLogger from "./src/logger-percent.js";

let loggers = makeLogger(
  [
    { height: 50, name: "statusline" },
    { height: 50, name: "statusline2", date: true },
    // { height: 33, name: "statusline2", date: true },
    // { height: "100%", name: "statusline2", date: true },
  ],
  (line, loggers) => {
    loggers.forEach((logger) => logger.log(line));
  },
  {
    split: true,
  },
);
setInterval(() => {
  // console.log("asdf");
  loggers[0].log("hjkl");
}, 800);

setInterval(() => {
  // console.log("asdf");
  loggers[1].log("piu");
}, 890);
let i = 0;

setInterval(() => {
  i++;
  loggers[0].log(i + " log");
  loggers[1].log('testing "' + i + '"');
}, 1000);

setInterval(() => {
  // loggers[0].log("i1.-njlii".repeat(12));
  loggers[1].log("this is a: " + "verylong text ".repeat(58));
}, 2400);
