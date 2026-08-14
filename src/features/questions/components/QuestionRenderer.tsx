"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";

import type {
  ChoiceQuestionContent,
  ClassificationQuestionContent,
  FillInBlanksQuestionContent,
  PublicQuestionAsset,
  PublicQuestionItem,
  QuestionCheckResult,
  QuestionResponse,
  ShortAnswerQuestionContent
} from "@/features/questions/contracts";

/**
 * Renderers that build their answer one piece at a time (a blank, a row) pass an
 * updater rather than a finished value, so two changes landing in the same render
 * cannot overwrite each other.
 */
export type RespondArgument =
  | QuestionResponse
  | ((previous: QuestionResponse | undefined) => QuestionResponse);

export interface QuestionRendererProps {
  question: PublicQuestionItem;
  response: QuestionResponse | undefined;
  result: QuestionCheckResult | undefined;
  showExplanation: boolean;
  onRespond: (response: RespondArgument) => void;
}

function findAsset(assets: PublicQuestionAsset[], ref: string): PublicQuestionAsset | undefined {
  return assets.find((asset) => asset.ref === ref);
}

function Stimulus({
  stimulus,
  assets
}: {
  stimulus: { text?: string; assetRefs: string[] } | undefined;
  assets: PublicQuestionAsset[];
}) {
  if (!stimulus) {
    return null;
  }
  return (
    <>
      {stimulus.text ? <div className="question-stimulus-text">{stimulus.text}</div> : null}
      {stimulus.assetRefs.map((ref) => {
        const asset = findAsset(assets, ref);
        return asset ? (
          <div className="question-stimulus-image" key={asset.id}>
            <Image
              src={asset.url}
              alt={asset.altText}
              width={960}
              height={520}
              sizes="(max-width: 760px) 92vw, 760px"
              unoptimized
            />
          </div>
        ) : null;
      })}
    </>
  );
}

function ChoiceRenderer({
  question,
  response,
  result,
  showExplanation,
  onRespond,
  imageOptions
}: QuestionRendererProps & { imageOptions: boolean }) {
  const content = question.content as ChoiceQuestionContent;
  const assets = question.assets;
  const selectedOptionId = response?.kind === "choice" ? response.optionId : undefined;
  const revealAnswer = Boolean(result && (result.outcome === "correct" || showExplanation));

  return (
    <>
      <Stimulus stimulus={content.stimulus} assets={assets} />

      <div className={`handbook-choice-grid${imageOptions ? " handbook-choice-grid-images" : ""}`}>
        {content.options.map((option, index) => {
          const asset = option.assetRef ? findAsset(assets, option.assetRef) : undefined;
          const selected = option.id === selectedOptionId;
          const correct = revealAnswer && option.id === result?.correctOptionId;
          const wrong = Boolean(result && selected && result.outcome !== "correct");
          const stateClass = correct ? " is-correct" : wrong ? " is-wrong" : selected ? " is-selected" : "";
          const optionLabel = String.fromCharCode(65 + index);

          return (
            <button
              className={`handbook-choice${stateClass}`}
              type="button"
              key={option.id}
              aria-pressed={selected}
              disabled={Boolean(result)}
              onClick={() => onRespond({ kind: "choice", optionId: option.id })}
            >
              <span className="handbook-choice-letter" aria-hidden="true">
                {optionLabel}
              </span>
              <span className="handbook-choice-content">
                {asset ? (
                  <Image
                    src={asset.url}
                    alt={option.accessibleLabel ?? asset.altText}
                    width={360}
                    height={230}
                    sizes="(max-width: 480px) 68vw, 280px"
                    unoptimized
                  />
                ) : null}
                {option.text ? <strong>{option.text}</strong> : null}
              </span>
              {correct ? <Check className="handbook-choice-state" size={24} aria-hidden="true" /> : null}
              {wrong ? <X className="handbook-choice-state" size={24} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </>
  );
}

function FillInBlanksRenderer({ question, response, result, onRespond }: QuestionRendererProps) {
  const content = question.content as FillInBlanksQuestionContent;
  const values = response?.kind === "fill-in-blanks" ? response.blanks : {};
  const locked = Boolean(result);

  function update(blankId: string, value: string) {
    onRespond((previous) => ({
      kind: "fill-in-blanks",
      blanks: {
        ...(previous?.kind === "fill-in-blanks" ? previous.blanks : {}),
        [blankId]: value
      }
    }));
  }

  return (
    <>
      <Stimulus stimulus={content.stimulus} assets={question.assets} />

      <p className="fill-blank-sentence">
        {content.segments.map((segment, index) => {
          if (segment.type === "text") {
            return <span key={`text-${index}`}>{segment.value}</span>;
          }

          const verdict = result?.blanks?.[segment.id];
          const stateClass = verdict ? (verdict.correct ? " is-correct" : " is-wrong") : "";

          return (
            <span className="fill-blank-slot" key={segment.id}>
              <input
                className={`fill-blank-input${stateClass}`}
                type="text"
                value={values[segment.id] ?? ""}
                aria-label={segment.label}
                disabled={locked}
                autoComplete="off"
                onChange={(event) => update(segment.id, event.target.value)}
              />
              {verdict && !verdict.correct ? (
                <span className="fill-blank-expected">{verdict.expected}</span>
              ) : null}
            </span>
          );
        })}
      </p>
    </>
  );
}

function ShortAnswerRenderer({ question, response, result, onRespond }: QuestionRendererProps) {
  const content = question.content as ShortAnswerQuestionContent;
  const value = response?.kind === "short-answer" ? response.text : "";

  return (
    <>
      <Stimulus stimulus={content.stimulus} assets={question.assets} />

      <textarea
        className="short-answer-input"
        value={value}
        rows={4}
        maxLength={2000}
        placeholder="Write your answer in your own words."
        aria-label="Your answer"
        disabled={Boolean(result)}
        onChange={(event) => onRespond({ kind: "short-answer", text: event.target.value })}
      />

      {result?.modelAnswer ? (
        <div className="model-answer">
          <h3>Model answer</h3>
          <p>{result.modelAnswer.text}</p>
          {result.modelAnswer.keyIdeas.length > 0 ? (
            <>
              <p className="model-answer-label">Your answer should mention:</p>
              <ul>
                {result.modelAnswer.keyIdeas.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function ClassificationRenderer({ question, response, result, onRespond }: QuestionRendererProps) {
  const content = question.content as ClassificationQuestionContent;
  const assignments = response?.kind === "classification" ? response.assignments : {};
  const locked = Boolean(result);

  function assign(rowId: string, categoryId: string) {
    onRespond((previous) => ({
      kind: "classification",
      assignments: {
        ...(previous?.kind === "classification" ? previous.assignments : {}),
        [rowId]: categoryId
      }
    }));
  }

  return (
    <>
      <Stimulus stimulus={content.stimulus} assets={question.assets} />

      <table className="classification-table">
        <thead>
          <tr>
            <th scope="col">{content.rowHeading}</th>
            <th scope="col">{content.categoryHeading}</th>
          </tr>
        </thead>
        <tbody>
          {content.rows.map((row) => {
            const verdict = result?.rows?.[row.id];
            const rowClass = verdict ? (verdict.correct ? " is-correct" : " is-wrong") : "";
            const expected = verdict
              ? content.categories.find((category) => category.id === verdict.expectedCategoryId)
              : undefined;

            return (
              <tr className={`classification-row${rowClass}`} key={row.id}>
                <th scope="row">{row.label}</th>
                <td>
                  <div className="classification-choices" role="group" aria-label={row.label}>
                    {content.categories.map((category) => {
                      const selected = assignments[row.id] === category.id;
                      return (
                        <button
                          className={`classification-pill${selected ? " is-selected" : ""}`}
                          type="button"
                          key={category.id}
                          aria-pressed={selected}
                          disabled={locked}
                          onClick={() => assign(row.id, category.id)}
                        >
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                  {verdict && !verdict.correct && expected ? (
                    <p className="classification-expected">Answer: {expected.label}</p>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

const rendererRegistry: Record<
  PublicQuestionItem["renderer"],
  (props: QuestionRendererProps) => React.ReactNode
> = {
  "single-choice-text": (props) => <ChoiceRenderer {...props} imageOptions={false} />,
  "single-choice-image": (props) => <ChoiceRenderer {...props} imageOptions />,
  "fill-in-blanks": (props) => <FillInBlanksRenderer {...props} />,
  "short-answer": (props) => <ShortAnswerRenderer {...props} />,
  classification: (props) => <ClassificationRenderer {...props} />
};

export function QuestionRenderer(props: QuestionRendererProps) {
  return rendererRegistry[props.question.renderer](props);
}
