import { MermaidConfig } from '../config.type';
import { log } from '../logger';
import { DetectorRecord, DiagramDetector, DiagramLoader } from './types';

const directive =
  /[%]{2}[{]\s*(?:(?:(\w+)\s*:|(\w+))\s*(?:(?:(\w+))|((?:(?![}][%]{2}).|\r?\n)*))?\s*)(?:[}][%]{2})?/gi;
const anyComment = /\s*%%.*\n/gm;

const detectors: Record<string, DetectorRecord> = {};

/**
 * @function detectType Detects the type of the graph text. Takes into consideration the possible
 *   existence of an %%init directive
 *
 *   ```mermaid
 *   %%{initialize: {"startOnLoad": true, logLevel: "fatal" }}%%
 *   graph LR
 *    a-->b
 *    b-->c
 *    c-->d
 *    d-->e
 *    e-->f
 *    f-->g
 *    g-->h
 * ```
 * @param {string} text The text defining the graph
 * @param {{
 *   class: { defaultRenderer: string } | undefined;
 *   state: { defaultRenderer: string } | undefined;
 *   flowchart: { defaultRenderer: string } | undefined;
 * }} [config]
 * @returns {string} A graph definition key
 */
export const detectType = function (text: string, config?: MermaidConfig): string {
  text = text.replace(directive, '').replace(anyComment, '\n');
  for (const [key, { detector }] of Object.entries(detectors)) {
    const diagram = detector(text, config);
    if (diagram) {
      return key;
    }
  }

  throw new Error(`No diagram type detected for text: ${text}`);
};

export const addDetector = (key: string, detector: DiagramDetector, loader?: DiagramLoader) => {
  if (detectors[key]) {
    throw new Error(`Detector with key ${key} already exists`);
  }
  detectors[key] = { detector, loader };
  log.debug(`Detector with key ${key} added${loader ? ' with loader' : ''}`);
};

export const getDiagramLoader = (key: string) => detectors[key].loader;
