export type RGB = [number, number, number];

export enum Format {
  HEX_RGB = '#RRGGBB',
  RGB_FUNC = 'rgb(rrr,ggg,bbb)',
}

const formatters = new Map<Format, ([red, green, blue]: RGB) => string>();
formatters.set(
  Format.HEX_RGB,
  ([red, green, blue]) =>
    `#${leftPad(red.toString(16))}${leftPad(green.toString(16))}${leftPad(
      blue.toString(16)
    )}`
);
formatters.set(
  Format.RGB_FUNC,
  ([red, green, blue]) => `rgb(${red},${green},${blue})`
);

function leftPad(number: string): string {
  if (number.length > 1) {
    return number;
  }
  return `0${number}`;
}

export class Mixer {
  constructor(
    protected colors: RGB[],
    protected period = 1 / (colors.length - 1)
  ) {
    if (this.colors.length <= 1) {
      throw new Error('Must include at least two colors...');
    }
    const invalid = this.colors.filter(
      ([r, g, b]) => r > 255 || r < 0 || g > 255 || g < 0 || b > 255 || b < 0
    );
    if (!invalid.length) {
      return;
    }
    throw new Error(
      `Error: RGB color range:\n${invalid
        .reduce((errors, [r, g, b], index) => {
          errors.push(
            `\tOne of [${r}, ${g}, ${b}] is under 0 or over 255 at index: ${index}\n`
          );
          return errors;
        }, [] as string[])
        .join('')}`
    );
  }

  /**
   * Creates the mixed color at that phase.
   * @param phase a number between 0 and 1, representing percent phase
   */
  getRGB(phase: number): RGB {
    if (phase > 1 || phase < 0) {
      throw new Error('phase must be between 0 and 1, given: ' + phase);
    }
    const phasePeriod = phase / this.period;
    const a = phase === 1 ? this.colors.length - 2 : Math.floor(phasePeriod);
    const b = a + 1;
    console.log(a, b);
    const [aR, aG, aB] = this.colors[a];
    const [bR, bG, bB] = this.colors[b];

    const bPercent = phasePeriod - Math.floor(phasePeriod);
    const aPercent = 1 - bPercent;

    return [
      Math.floor(aR * aPercent + bR * bPercent),
      Math.floor(aG * aPercent + bG * bPercent),
      Math.floor(aB * aPercent + bB * bPercent),
    ];
  }

  getFormatted(phase: number, format = '#RRGGBB' as Format): string {
    const formatter = formatters.get(format);
    if (!formatter) {
      throw new Error('No formatter found for format: ' + format);
    }
    return formatter(this.getRGB(phase));
  }
}
