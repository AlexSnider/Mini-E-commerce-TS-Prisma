class LoggerPattern {
  who: string;
  ipAddress: string;
  what: string;
  where: string;
  when: string;
  why: string;

  constructor({
    who = "*",
    ipAddress = "*",
    what = "*",
    where = "*",
    when = "*",
    why = "*",
  }: {
    who?: string;
    ipAddress?: string;
    what?: string;
    where?: string;
    when?: string;
    why?: string;
  } = {}) {
    this.who = who;
    this.ipAddress = ipAddress;
    this.what = what;
    this.where = where;
    this.when = when;
    this.why = why;
  }

  log(): string {
    return `User ${this.who} | From ${this.ipAddress} | ${this.what} | At ${this.where} | On ${this.when} | Reason ${this.why}`;
  }

  toWinstonLog(): { [key: string]: string } {
    return {
      who: this.who,
      ipAddress: this.ipAddress,
      what: this.what,
      where: this.where,
      when: this.when,
      why: this.why,
    };
  }
}

export default LoggerPattern;
