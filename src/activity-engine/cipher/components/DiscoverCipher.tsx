"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Minus, Plus } from "lucide-react";
import { encode, getAlphabetMapping } from "@/activity-engine/cipher/cipher.engine";
import type { CipherDiscoverConfig } from "@/activity-engine/cipher/cipher.types";

interface DiscoverCipherProps {
  alphabet: string;
  config: CipherDiscoverConfig;
}

export function DiscoverCipher({ alphabet, config }: DiscoverCipherProps) {
  const [shift, setShift] = useState(config.shift);
  const [activeLetter, setActiveLetter] = useState(alphabet[0]);
  const secretMessage = encode(config.normalMessage, shift, alphabet);
  const mapping = getAlphabetMapping(shift, alphabet);
  const activeMapping = mapping.find(({ from }) => from === activeLetter) ?? mapping[0];
  const activeLetterIndex = alphabet.indexOf(activeMapping.from);
  const wrapsAround = shift > 0 && activeLetterIndex + shift >= alphabet.length;
  const mappingExplanation = getMappingExplanation(
    activeMapping.from,
    activeMapping.to,
    shift,
    wrapsAround
  );

  function changeShift(nextShift: number) {
    setShift(Math.max(0, Math.min(alphabet.length - 1, nextShift)));
  }

  return (
    <section className="discover-band" id="discover" aria-labelledby="discover-heading">
      <div className="content-frame stage-heading">
        <span className="stage-number stage-number-yellow" aria-hidden="true">1</span>
        <div>
          <p className="eyebrow">Discover</p>
          <h2 id="discover-heading">{config.title}</h2>
        </div>
      </div>

      <div className="content-frame discover-journey">
        <div className="discover-introduction">
          <p>{config.prompt}</p>
          <p>{config.keyExplanation}</p>
        </div>

        <div className="message-transformation" aria-label={`${config.normalMessage} becomes ${secretMessage} with key ${shift}`}>
          <div>
            <span>Normal message</span>
            <strong>{config.normalMessage}</strong>
          </div>
          <div className="transformation-key">
            <ArrowRight size={30} aria-hidden="true" />
            <span>Key = {shift}</span>
            <small>Move every letter {formatPlaces(shift)}</small>
          </div>
          <div>
            <span>Secret message</span>
            <strong aria-live="polite">{secretMessage}</strong>
          </div>
        </div>

        <div className="alphabet-map">
          <div className="alphabet-map-heading">
            <div>
              <p className="eyebrow">Alphabet map</p>
              <h3>Choose a normal letter</h3>
            </div>

            <div className="discover-key-control">
              <span>Key</span>
              <div className="shift-stepper">
                <button
                  type="button"
                  onClick={() => changeShift(shift - 1)}
                  disabled={shift <= 0}
                  aria-label="Decrease discovery key"
                >
                  <Minus size={20} aria-hidden="true" />
                </button>
                <output aria-live="polite" aria-label={`Current discovery key ${shift}`}>{shift}</output>
                <button
                  type="button"
                  onClick={() => changeShift(shift + 1)}
                  disabled={shift >= alphabet.length - 1}
                  aria-label="Increase discovery key"
                >
                  <Plus size={20} aria-hidden="true" />
                </button>
              </div>
            </div>

            <output className="alphabet-map-readout" aria-live="polite">
              <span className="mapping-pair">
                <strong>{activeMapping.from}</strong>
                <ArrowRight size={19} aria-hidden="true" />
                <strong>{activeMapping.to}</strong>
              </span>
              <span className="mapping-explanation">{mappingExplanation}</span>
            </output>
          </div>

          <div className="alphabet-table-scroll" tabIndex={0} aria-label={`Alphabet table for key ${shift}`}>
            <table className="alphabet-table">
              <tbody>
                <tr>
                  <th scope="row">Normal</th>
                  {mapping.map(({ from, to }) => (
                    <td className={from === activeLetter ? "is-active" : ""} key={`normal-${from}`}>
                      <button
                        type="button"
                        aria-label={`${from} becomes ${to}`}
                        aria-pressed={from === activeLetter}
                        onClick={() => setActiveLetter(from)}
                        onFocus={() => setActiveLetter(from)}
                        onPointerEnter={() => setActiveLetter(from)}
                      >
                        {from}
                      </button>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Secret</th>
                  {mapping.map(({ from, to }) => (
                    <td className={from === activeLetter ? "is-active" : ""} key={`secret-${from}`}>
                      <strong>{to}</strong>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="cipher-words" aria-labelledby="cipher-words-heading">
          <p className="eyebrow" id="cipher-words-heading">Two words to know</p>
          <div className="cipher-word-list">
            <div>
              <span aria-hidden="true"><EyeOff size={21} /></span>
              <p><strong>Encode</strong>Turn a normal message into a secret message.</p>
            </div>
            <div>
              <span aria-hidden="true"><Eye size={21} /></span>
              <p><strong>Decode</strong>Turn a secret message back into the normal message.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function getMappingExplanation(from: string, to: string, shift: number, wrapsAround: boolean): string {
  if (shift === 0) {
    return `${from} does not move. It stays ${to}.`;
  }

  if (wrapsAround) {
    return `${from} moves ${formatPlaces(shift)} and wraps back to ${to}.`;
  }

  return `${from} moves ${formatPlaces(shift)} to become ${to}.`;
}

function formatPlaces(shift: number): string {
  return `${shift} ${shift === 1 ? "place" : "places"}`;
}
