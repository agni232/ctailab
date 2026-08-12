"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";

import type {
  ChoiceCheckResult,
  PublicQuestionAsset,
  PublicQuestionItem
} from "@/features/questions/contracts";

interface QuestionRendererProps {
  question: PublicQuestionItem;
  selectedOptionId: string | undefined;
  result: ChoiceCheckResult | undefined;
  showExplanation: boolean;
  onSelect: (optionId: string) => void;
}

interface ChoiceRendererProps extends QuestionRendererProps {
  imageOptions: boolean;
}

function findAsset(assets: PublicQuestionAsset[], ref: string): PublicQuestionAsset | undefined {
  return assets.find((asset) => asset.ref === ref);
}

function ChoiceRenderer({
  question,
  selectedOptionId,
  result,
  showExplanation,
  onSelect,
  imageOptions
}: ChoiceRendererProps) {
  const { content, assets } = question;
  const revealAnswer = Boolean(result && (result.correct || showExplanation));

  return (
    <>
      {content.stimulus?.text ? (
        <div className="question-stimulus-text">{content.stimulus.text}</div>
      ) : null}

      {content.stimulus?.assetRefs.map((ref) => {
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

      <div className={`handbook-choice-grid${imageOptions ? " handbook-choice-grid-images" : ""}`}>
        {content.options.map((option, index) => {
          const asset = option.assetRef ? findAsset(assets, option.assetRef) : undefined;
          const selected = option.id === selectedOptionId;
          const correct = revealAnswer && option.id === result?.correctOptionId;
          const wrong = Boolean(result && selected && !result.correct);
          const stateClass = correct ? " is-correct" : wrong ? " is-wrong" : selected ? " is-selected" : "";
          const optionLabel = String.fromCharCode(65 + index);

          return (
            <button
              className={`handbook-choice${stateClass}`}
              type="button"
              key={option.id}
              aria-pressed={selected}
              disabled={Boolean(result)}
              onClick={() => onSelect(option.id)}
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

const rendererRegistry: Record<
  PublicQuestionItem["renderer"],
  (props: QuestionRendererProps) => React.ReactNode
> = {
  "single-choice-text": (props) => <ChoiceRenderer {...props} imageOptions={false} />,
  "single-choice-image": (props) => <ChoiceRenderer {...props} imageOptions />
};

export function QuestionRenderer(props: QuestionRendererProps) {
  return rendererRegistry[props.question.renderer](props);
}
