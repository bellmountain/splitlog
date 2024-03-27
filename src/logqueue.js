function createBoundedQueue(maxSize) {
  const items = [];
  return {
    enqueue(element) {
      if (items.length === maxSize) {
        this.dequeue();
      }
      items.push(element);
    },
    dequeue() {
      if (items.length === 0) {
        return "Queue is empty";
      }
      return items.shift();
    },
    front() {
      if (items.length === 0) {
        return "Queue is empty";
      }
      return items[0];
    },
    isEmpty() {
      return items.length === 0;
    },
    size() {
      return items.length;
    },
    printQueue() {
      return items.join("\n");
    },
    get(amount, width) {
      let text = "";
      let i = 0;

      while (i < amount) {
        if (items[items.length - 1 - i]) {
          const length = items[items.length - 1 - i].length,
            k = i;

          //insert long lines in reverse order
          for (let j = Math.floor(length / width); j >= 0; j--) {
            text =
              items[items.length - 1 - k].substr(j * (width - 1), width - 1) +
              "\n" +
              text;

            i++;
            if (i >= amount) break;
          }
        } else {
          text = "\n" + text;
          i++;
        }
      }
      return text;
    },
  };
}

export default createBoundedQueue;
