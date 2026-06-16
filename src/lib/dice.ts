// Safe expression engine for D&D math. No eval(): a tiny recursive-descent
// parser builds an AST that supports +,-,*,/, parentheses, numbers, variables
// (e.g. mod.str, prof, level), function calls (floor, ceil, min, max, abs),
// and dice terms like 2d6. The same AST is evaluated three ways: rolled
// (random), averaged, or as pure arithmetic (dice rejected).

export type Vars = Record<string, number>;

type Node =
  | { t: "num"; v: number }
  | { t: "var"; name: string }
  | { t: "dice"; count: Node; sides: number }
  | { t: "bin"; op: string; a: Node; b: Node }
  | { t: "neg"; a: Node }
  | { t: "call"; name: string; args: Node[] };

const FUNCS: Record<string, (...n: number[]) => number> = {
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
};

class Parser {
  private i = 0;
  private toks: string[];
  constructor(src: string) {
    // tokenize: numbers (with optional dN), identifiers (with dots), operators
    this.toks =
      src.match(/\d+d\d+|\d+\.\d+|\d+|[a-zA-Z_][a-zA-Z0-9_.]*|[()+\-*/,]/g) ?? [];
  }
  private peek() {
    return this.toks[this.i];
  }
  private next() {
    return this.toks[this.i++];
  }
  parse(): Node {
    const n = this.expr();
    if (this.i < this.toks.length) throw new Error(`Unexpected: ${this.peek()}`);
    return n;
  }
  private expr(): Node {
    let a = this.term();
    while (this.peek() === "+" || this.peek() === "-") {
      const op = this.next();
      a = { t: "bin", op, a, b: this.term() };
    }
    return a;
  }
  private term(): Node {
    let a = this.unary();
    while (this.peek() === "*" || this.peek() === "/") {
      const op = this.next();
      a = { t: "bin", op, a, b: this.unary() };
    }
    return a;
  }
  private unary(): Node {
    if (this.peek() === "-") {
      this.next();
      return { t: "neg", a: this.unary() };
    }
    return this.atom();
  }
  private atom(): Node {
    const tok = this.next();
    if (tok === undefined) throw new Error("Unexpected end of formula");
    if (tok === "(") {
      const n = this.expr();
      if (this.next() !== ")") throw new Error("Missing )");
      return n;
    }
    // dice term NdM
    const dice = /^(\d+)d(\d+)$/.exec(tok);
    if (dice) {
      return { t: "dice", count: { t: "num", v: +dice[1] }, sides: +dice[2] };
    }
    if (/^\d/.test(tok)) return { t: "num", v: parseFloat(tok) };
    // function call?
    if (this.peek() === "(") {
      this.next();
      const args: Node[] = [];
      if (this.peek() !== ")") {
        args.push(this.expr());
        while (this.peek() === ",") {
          this.next();
          args.push(this.expr());
        }
      }
      if (this.next() !== ")") throw new Error("Missing ) in call");
      return { t: "call", name: tok, args };
    }
    return { t: "var", name: tok };
  }
}

type Mode = { dice: (count: number, sides: number) => number; allowDice: boolean };

function evalNode(n: Node, vars: Vars, mode: Mode): number {
  switch (n.t) {
    case "num":
      return n.v;
    case "var": {
      if (!(n.name in vars)) throw new Error(`Unknown variable: ${n.name}`);
      return vars[n.name];
    }
    case "neg":
      return -evalNode(n.a, vars, mode);
    case "bin": {
      const a = evalNode(n.a, vars, mode);
      const b = evalNode(n.b, vars, mode);
      switch (n.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return b === 0 ? 0 : a / b;
      }
      throw new Error(`Bad op ${n.op}`);
    }
    case "call": {
      const f = FUNCS[n.name];
      if (!f) throw new Error(`Unknown function: ${n.name}`);
      return f(...n.args.map((a) => evalNode(a, vars, mode)));
    }
    case "dice": {
      if (!mode.allowDice) throw new Error("Dice not allowed here");
      const count = Math.max(0, Math.round(evalNode(n.count, vars, mode)));
      return mode.dice(count, n.sides);
    }
  }
}

function parse(expr: string): Node {
  return new Parser(expr).parse();
}

/** Evaluate a pure-arithmetic formula to a number. Dice are rejected. */
export function evalFormula(expr: string, vars: Vars = {}): number {
  if (!expr || !expr.trim()) return 0;
  return evalNode(parse(expr), vars, {
    allowDice: false,
    dice: () => {
      throw new Error("dice");
    },
  });
}

/** Roll an expression (dice are random). Returns total and per-die breakdown. */
export function rollExpr(
  expr: string,
  vars: Vars = {},
): { total: number; rolls: number[] } {
  const rolls: number[] = [];
  const total = evalNode(parse(expr), vars, {
    allowDice: true,
    dice: (count, sides) => {
      let sum = 0;
      for (let k = 0; k < count; k++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        sum += r;
      }
      return sum;
    },
  });
  return { total: Math.round(total), rolls };
}

/** Average value of an expression (dice use their mean). */
export function avgExpr(expr: string, vars: Vars = {}): number {
  return evalNode(parse(expr), vars, {
    allowDice: true,
    dice: (count, sides) => count * ((sides + 1) / 2),
  });
}

/** Double every dice term in an expression (NdM -> 2N dM) for critical hits.
 * Flat modifiers are not doubled, matching 5e crit rules. */
export function critDice(expr: string): string {
  return expr.replace(/(\d+)d(\d+)/g, (_, n, m) => `${parseInt(n, 10) * 2}d${m}`);
}

/** Validate a formula against a sample var set. Returns null if ok, else message. */
export function validateFormula(expr: string, vars: Vars, allowDice: boolean): string | null {
  try {
    const node = parse(expr);
    evalNode(node, vars, {
      allowDice,
      dice: (c, s) => c * ((s + 1) / 2),
    });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Invalid formula";
  }
}
